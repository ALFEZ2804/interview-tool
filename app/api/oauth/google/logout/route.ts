import { NextRequest, NextResponse } from "next/server";
import { originFromRequest } from "@/lib/google";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

// Cierra sesión: borra la cookie y vuelve al login.
export async function GET(req: NextRequest) {
  const origin = originFromRequest(req);
  const res = NextResponse.redirect(`${origin}/login`);
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
