import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, redirectUriFor, originFromRequest } from "@/lib/google";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Recibe el code de Google, lo intercambia por tokens, identifica la cuenta por
// email y guarda el refresh token cifrado. Redirige a /connect con el estado.
export async function GET(req: NextRequest) {
  const origin = originFromRequest(req);
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const oauthError = params.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/connect?error=${encodeURIComponent(oauthError)}`
    );
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/connect?error=missing_code`);
  }

  try {
    const { email, refreshToken } = await exchangeCode(
      code,
      redirectUriFor(origin)
    );

    if (refreshToken) {
      await prisma.googleAccount.upsert({
        where: { email },
        update: { refreshToken: encryptToken(refreshToken) },
        create: { email, refreshToken: encryptToken(refreshToken) },
      });
    } else {
      // Google solo devuelve refresh token con prompt=consent / primera vez.
      // Si la cuenta ya existía conservamos el anterior; si no, avisamos.
      const exists = await prisma.googleAccount.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.redirect(
          `${origin}/connect?error=no_refresh_token&email=${encodeURIComponent(email)}`
        );
      }
    }

    return NextResponse.redirect(
      `${origin}/connect?ok=${encodeURIComponent(email)}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error_desconocido";
    return NextResponse.redirect(
      `${origin}/connect?error=${encodeURIComponent(msg)}`
    );
  }
}
