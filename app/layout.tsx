import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--background)]/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--accent)] text-black font-bold">
                N
              </span>
              <span className="text-sm font-semibold tracking-tight">
                Nova{" "}
                <span className="text-[color:var(--muted)] font-normal">
                  · Interview Tool
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm text-[color:var(--muted)]">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)] transition"
              >
                Entrevistas
              </Link>
              <span className="rounded-md px-3 py-1.5 text-[color:var(--muted-2)]">
                Plantillas
              </span>
              <span className="rounded-md px-3 py-1.5 text-[color:var(--muted-2)]">
                Equipo
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-[color:var(--border)] py-6">
          <div className="mx-auto max-w-6xl px-6 text-xs text-[color:var(--muted-2)]">
            Construido con el tema Nova · Solo front, datos simulados
          </div>
        </footer>
      </body>
    </html>
  );
}
