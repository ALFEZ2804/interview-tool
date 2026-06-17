import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Rutas accesibles sin sesión: el login, el propio flujo OAuth, y los endpoints
// que se autoprotegen con su secreto (ingesta y cron).
function isPublic(pathname: string): boolean {
  if (pathname === "/login") return true;
  return (
    pathname.startsWith("/api/oauth/") ||
    pathname.startsWith("/api/ingest") ||
    pathname.startsWith("/api/cron/")
  );
}

// En Next 16 la convención "middleware" está obsoleta; se usa "proxy".
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("nova_session")?.value;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      return NextResponse.next();
    } catch {
      // token inválido o caducado → al login
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Todo excepto estáticos de Next y el favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
