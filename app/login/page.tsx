import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "Usa tu cuenta corporativa de Nova Talent para entrar.",
  no_refresh_token:
    "No se pudo completar la conexión. Revoca el acceso de la app en tu cuenta de Google e inténtalo de nuevo.",
  missing_code: "Faltó el código de Google. Inténtalo de nuevo.",
  access_denied:
    "Has cancelado el inicio de sesión. Puedes intentarlo de nuevo cuando quieras.",
  server:
    "Algo ha fallado por nuestra parte. Vuelve a intentarlo en unos segundos; si sigue pasando, avísanos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const sp = await searchParams;
  // Fallback sin filtrar el código crudo (puede traer un stack de Prisma/red).
  const msg = sp.error
    ? ERROR_MESSAGES[sp.error] || "No se pudo iniciar sesión. Vuelve a intentarlo."
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
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p className="text-sm leading-relaxed text-[color:var(--foreground)]">
            {msg}
          </p>
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
