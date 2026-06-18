import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { NovaMark } from "@/components/nova-logo";
import { getSession } from "@/lib/auth";
import "./globals.css";

// Todas las páginas leen de la BD/sesión en cada request: renderizado dinámico
// para que `next build` no intente conectar a Postgres al prerenderizar.
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova Interview Tool",
  description:
    "Feedback de entrevistas y sugerencias inteligentes de preguntas para tu próximo proceso.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <div aria-hidden className="app-atmosphere" />
        {session ? (
          <>
            <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--background)]/75 backdrop-blur-md">
              <div className="flex h-14 items-center gap-4 px-6">
                <Link href="/" className="flex shrink-0 items-center gap-2">
                  <span className="nova-mark inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg">
                    <NovaMark className="h-full w-full" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight">
                    Nova{" "}
                    <span className="text-[color:var(--muted)] font-normal">
                      · Interview Tool
                    </span>
                  </span>
                </Link>

                <div className="ml-auto flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs text-[color:var(--muted-2)] lg:inline">
                    {session.email}
                  </span>
                  <a
                    href="/api/oauth/google/logout"
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
                  >
                    <LogoutIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </header>
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 min-w-0 px-6 py-10">
                <div className="mx-auto max-w-5xl">{children}</div>
              </main>
            </div>
          </>
        ) : (
          <main className="flex flex-1 items-center justify-center px-6 py-10">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}

function LogoutIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
