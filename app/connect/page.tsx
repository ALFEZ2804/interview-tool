import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; email?: string }>;
}) {
  const sp = await searchParams;

  let accounts: { email: string; createdAt: Date }[] = [];
  try {
    accounts = await prisma.googleAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { email: true, createdAt: true },
    });
  } catch {
    // Sin BD la página sigue mostrando el botón; el error saltaría al conectar.
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
          Nova · Interview Tool
        </div>
        <h1 className="text-3xl font-semibold tracking-tight gradient-text">
          Conectar Google Drive
        </h1>
        <p className="max-w-2xl text-[color:var(--muted)] leading-relaxed">
          Conecta tu cuenta de Google (solo lectura) para que las
          transcripciones “Notes by Gemini” de tus entrevistas entren solas.
          Nombra las reuniones de Meet como{" "}
          <code className="rounded bg-[color:var(--surface)] px-1.5 py-0.5 text-[13px]">
            Entrevista - Posición - Candidato
          </code>
          .
        </p>
      </section>

      {sp.ok && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          Cuenta conectada: <strong>{sp.ok}</strong>
        </div>
      )}
      {sp.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          No se pudo conectar: <span className="font-mono">{sp.error}</span>
          {sp.error === "no_refresh_token" &&
            " — revoca el acceso de la app en tu cuenta de Google y vuelve a conectar."}
        </div>
      )}

      <a
        href="/api/oauth/google/start"
        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        Conectar Google
      </a>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted-2)]">
          Cuentas conectadas ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">Ninguna todavía.</p>
        ) : (
          <ul className="space-y-1.5">
            {accounts.map((a) => (
              <li key={a.email} className="flex items-center gap-2 text-sm">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {a.email}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
