import Link from "next/link";
import { Suspense } from "react";
import { getPositionsWithInterviews, getRecentInterviews } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { InterviewCard } from "@/components/interview-card";
import { SearchBar } from "@/components/search-bar";
import {
  PositionFilters,
  type PositionFilter,
} from "@/components/position-filters";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; position?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const positionId = sp.position || undefined;

  let interviews: Awaited<ReturnType<typeof getRecentInterviews>> = [];
  let positionFilters: PositionFilter[] = [];
  let dbError = false;

  try {
    [interviews, positionFilters] = await Promise.all([
      getRecentInterviews(session, { q, positionId }),
      getPositionsWithInterviews(session).then((ps) =>
        ps.map((p) => ({
          id: p.id,
          name: p.name,
          count: p.interviews.length,
        }))
      ),
    ]);
  } catch {
    dbError = true;
  }

  const activePosition = positionFilters.find((p) => p.id === positionId);
  const isSearching = Boolean(q || positionId);

  return (
    <div className="space-y-8">
      <Hero
        isSearching={isSearching}
        q={q}
        positionName={activePosition?.name}
        count={interviews.length}
      />

      {!dbError && (
        <Suspense
          fallback={
            <div className="h-[3.25rem] w-full rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)]" />
          }
        >
          <SearchBar />
        </Suspense>
      )}

      {!dbError && positionFilters.length > 0 && (
        <PositionFilters
          positions={positionFilters}
          activeId={positionId}
          q={q}
        />
      )}

      {dbError ? (
        <DbErrorState />
      ) : interviews.length === 0 ? (
        <EmptyState isSearching={isSearching} q={q} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {interviews.map((interview, i) => (
            <InterviewCard key={interview.id} interview={interview} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hero({
  isSearching,
  q,
  positionName,
  count,
}: {
  isSearching: boolean;
  q?: string;
  positionName?: string;
  count: number;
}) {
  return (
    <section className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent)] font-semibold">
        Nova · Interview Tool
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
          {isSearching ? (
            <span className="gradient-text">
              {q ? `Resultados para “${q}”` : positionName}
            </span>
          ) : (
            <span className="gradient-text">Entrevistas recientes</span>
          )}
        </h1>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent)] px-3.5 py-2 text-sm font-medium text-black transition hover:bg-[color:var(--accent-hover)]"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva entrevista
        </Link>
      </div>
      <p className="text-sm text-[color:var(--muted)]">
        {isSearching
          ? `${count} ${count === 1 ? "entrevista" : "entrevistas"}${
              positionName && q ? ` en ${positionName}` : ""
            }.`
          : "Tus últimas entrevistas analizadas. Usa el buscador o filtra por posición."}
      </p>
    </section>
  );
}

function EmptyState({ isSearching, q }: { isSearching: boolean; q?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-6 py-14 text-center">
      {isSearching ? (
        <p className="text-sm text-[color:var(--muted)]">
          Sin entrevistas{q ? ` para “${q}”` : " en esta posición"}. Prueba con
          otro término o quita el filtro.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[color:var(--muted)]">
            Aún no tienes entrevistas analizadas. Sube tu primer transcript o
            sincroniza tus notas de Gemini.
          </p>
          <Link
            href="/new"
            className="inline-block rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-black transition hover:bg-[color:var(--accent-hover)]"
          >
            Subir la primera entrevista
          </Link>
        </div>
      )}
    </div>
  );
}

function DbErrorState() {
  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-6 py-10 text-center text-sm text-[color:var(--warning)] leading-relaxed">
      No se pudo conectar a la base de datos. Revisa{" "}
      <code className="font-mono">DATABASE_URL</code> en{" "}
      <code className="font-mono">.env</code>.
    </div>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
