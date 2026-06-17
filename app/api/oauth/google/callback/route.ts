import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, redirectUriFor, originFromRequest } from "@/lib/google";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  emailAllowed,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export const runtime = "nodejs";

// El callback ES el login: intercambia el code, valida el dominio, guarda el
// refresh token cifrado (con backfill del histórico) y abre sesión.
export async function GET(req: NextRequest) {
  const origin = originFromRequest(req);
  const secure = origin.startsWith("https://");
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const oauthError = params.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    );
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const { email, name, refreshToken } = await exchangeCode(
      code,
      redirectUriFor(origin)
    );

    if (!emailAllowed(email)) {
      return NextResponse.redirect(`${origin}/login?error=domain`);
    }

    // Histórico: al conectar por primera vez, mira hacia atrás N días.
    const days = parseInt(process.env.INGEST_BACKFILL_DAYS || "90", 10);
    const ingestSince = new Date(
      Date.now() - (Number.isFinite(days) ? days : 90) * 86_400_000
    );

    if (refreshToken) {
      await prisma.googleAccount.upsert({
        where: { email },
        update: { refreshToken: encryptToken(refreshToken) },
        create: { email, refreshToken: encryptToken(refreshToken), ingestSince },
      });
    } else {
      // Google solo devuelve refresh token con prompt=consent / primera vez.
      // Si la cuenta es nueva y no llega, no podríamos ingerir: pedimos reconsentir.
      const exists = await prisma.googleAccount.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.redirect(`${origin}/login?error=no_refresh_token`);
      }
    }

    const token = await createSessionToken({ email, name });
    const res = NextResponse.redirect(`${origin}/`);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));
    return res;
  } catch (err) {
    // No filtramos el error crudo (Prisma/red) a la URL ni al usuario: se loguea
    // en el servidor y se muestra un mensaje genérico en /login.
    console.error("[oauth/callback]", err);
    return NextResponse.redirect(`${origin}/login?error=server`);
  }
}
