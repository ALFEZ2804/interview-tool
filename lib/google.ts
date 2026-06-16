import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import { decryptToken } from "@/lib/crypto";

// Solo lectura de Drive + identidad (email) para saber de quién es cada cuenta.
const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive.readonly",
];

function oauthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el entorno."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Origin público de la request (válido en localhost y detrás del proxy de
// Vercel), para construir el redirect_uri que debe coincidir con el registrado.
export function originFromRequest(req: Request): string {
  const h = req.headers;
  const host =
    h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function redirectUriFor(origin: string): string {
  return `${origin}/api/oauth/google/callback`;
}

export function getAuthUrl(redirectUri: string): string {
  return oauthClient(redirectUri).generateAuthUrl({
    access_type: "offline", // necesario para recibir refresh token
    prompt: "consent", // fuerza que Google devuelva refresh token cada vez
    scope: SCOPES,
    include_granted_scopes: true,
  });
}

export type ExchangeResult = {
  email: string;
  refreshToken: string | null;
};

// Intercambia el code de OAuth por tokens y devuelve el email + refresh token.
export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<ExchangeResult> {
  const client = oauthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  if (!data.email) {
    throw new Error("Google no devolvió el email de la cuenta.");
  }
  return { email: data.email, refreshToken: tokens.refresh_token ?? null };
}

// Cliente Drive autenticado para una cuenta ya conectada. googleapis refresca
// el access token automáticamente usando el refresh token (descifrado).
export function driveClientForAccount(account: {
  refreshToken: string;
}): drive_v3.Drive {
  const client = oauthClient("https://localhost/unused"); // redirect no usado al refrescar
  client.setCredentials({ refresh_token: decryptToken(account.refreshToken) });
  return google.drive({ version: "v3", auth: client });
}
