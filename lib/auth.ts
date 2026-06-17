import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Sesión de aplicación. El login es el propio OAuth de Google: tras el callback
// se firma este JWT y se guarda en una cookie httpOnly. El middleware lo verifica
// para bloquear toda la app a quien no haya entrado.

export const SESSION_COOKIE = "nova_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Falta AUTH_SECRET en el entorno.");
  return new TextEncoder().encode(s);
}

export type Session = { email: string; name?: string };

export async function createSessionToken(session: Session): Promise<string> {
  return await new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string
): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.email !== "string") return null;
    return {
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

// Para server components / páginas.
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function allowedDomain(): string | null {
  const d = process.env.ALLOWED_EMAIL_DOMAIN;
  return d && d.trim() ? d.trim().toLowerCase() : null;
}

// Si hay dominio configurado, solo se admiten emails de ese dominio.
export function emailAllowed(email: string): boolean {
  const d = allowedDomain();
  if (!d) return true;
  return email.toLowerCase().endsWith("@" + d);
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

// Cuántos días hacia atrás ve cada headhunter sus entrevistas (admins ven todo).
export function interviewViewDays(): number {
  const days = parseInt(process.env.INTERVIEW_VIEW_DAYS || "90", 10);
  return Number.isFinite(days) && days > 0 ? days : 90;
}

export function interviewViewCutoff(): Date {
  return new Date(Date.now() - interviewViewDays() * 86_400_000);
}

// Filtro Prisma para entrevistas visibles según sesión.
export function interviewVisibilityFilter(session: Session) {
  if (isAdmin(session.email)) return {};
  return {
    interviewerEmail: session.email,
    date: { gte: interviewViewCutoff() },
  };
}
