import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "Usa tu cuenta corporativa de Nova Talent para entrar.",
  no_refresh_token:
    "No se pudo completar la conexión. Revoca el acceso de la app en tu cuenta de Google e inténtalo de nuevo.",
  missing_code: "Faltó el código de Google. Inténtalo de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const sp = await searchParams;
  const msg = sp.error
    ? ERROR_MESSAGES[sp.error] || `No se pudo iniciar sesión (${sp.error}).`
    : null;

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-black font-bold text-lg">
          N
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Nova · Interview Tool
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          Inicia sesión con tu cuenta de Google para entrar.
        </p>
      </div>

      {msg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      <a
        href="/api/oauth/google/start"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-medium transition hover:bg-[color:var(--accent-soft)]"
      >
        Iniciar sesión con Google
      </a>

      <p className="text-xs text-[color:var(--muted-2)]">
        Al entrar, autorizas el acceso de solo lectura a tus Google Docs de
        entrevistas para subirlas automáticamente.
      </p>
    </div>
  );
}
