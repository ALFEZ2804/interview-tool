import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, redirectUriFor, originFromRequest } from "@/lib/google";

export const runtime = "nodejs";

// Inicia el flujo OAuth: redirige a la pantalla de consentimiento de Google.
export async function GET(req: NextRequest) {
  const origin = originFromRequest(req);
  const url = getAuthUrl(redirectUriFor(origin));
  return NextResponse.redirect(url);
}
