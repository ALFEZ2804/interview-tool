import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Interview } from "@/lib/types";
import { AgentSuggestionsPanel } from "@/components/agent-suggestions";
import { RatingStars } from "@/components/rating-stars";
import { getSession, interviewVisibilityFilter, isAdmin } from "@/lib/auth";

const statusLabels = {
  completed: "Cerrada",
  "pending-review": "Pendiente de revisión",
  drafting: "Borrador",
} as const;

export default async function PositionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const interviewWhere =
    session && !isAdmin(session.email)
      ? interviewVisibilityFilter(session)
      : undefined;

  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      interviews: { where: interviewWhere, orderBy: { date: "desc" } },
    },
  });

  if (!position) notFound();

  const latest = position.interviews[0];
  const latestAnalysis = latest
    ? (latest.analysis as unknown as Omit<Interview, "id">)
    : null;

  return (
    <div className="space-y-8">
      <header className="border-b border-[color:var(--border)] pb-6">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
          Posición
        </div>
        <h1 className="text-2xl font-semibold mt-1">{position.name}</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          {position.interviews.length}{" "}
          {position.interviews.length === 1 ? "entrevista" : "entrevistas"}
        </p>
      </header>

      {latestAnalysis ? (
        <section className="space-y-3">
          <p className="text-xs text-[color:var(--muted)]">
            Recomendaciones basadas en la entrevista más reciente:{" "}
            <span className="text-[color:var(--foreground)] font-medium">
              {latestAnalysis.candidate.name}
            </span>{" "}
            ({formatDate(latest.date)}).
          </p>
          <AgentSuggestionsPanel
            suggestions={latestAnalysis.agent}
            roleTitle={latestAnalysis.role.title}
          />
        </section>
      ) : (
        <section className="rounded-[var(--radius)] border border-dashed border-[color:var(--border-strong)] px-6 py-10 text-center space-y-3">
          <p className="text-sm text-[color:var(--muted)]">
            Esta posición aún no tiene entrevistas, así que el agente no puede
            recomendarte preguntas.
          </p>
          <Link
            href="/new"
            className="inline-block rounded-md bg-[color:var(--accent)] text-black text-sm font-medium px-4 py-2 hover:bg-[color:var(--accent-hover)] transition"
          >
            Subir la primera entrevista
          </Link>
        </section>
      )}

      {position.interviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Entrevistas</h2>
          <ul className="space-y-3">
            {position.interviews.map((row) => {
              const analysis = row.analysis as unknown as Omit<
                Interview,
                "id"
              >;
              return (
                <li key={row.id}>
                  <Link
                    href={`/interview/${row.id}`}
                    className="block rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-2)] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border-strong)] text-xs font-semibold">
                          {analysis.candidate.avatarInitials}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {row.candidateName}
                          </div>
                          <div className="text-xs text-[color:var(--muted)] truncate">
                            {analysis.candidate.headline}
                          </div>
                          <div className="text-[11px] text-[color:var(--muted-2)] mt-1">
                            {statusLabels[
                              row.status as keyof typeof statusLabels
                            ] ?? row.status}{" "}
                            · {formatDate(row.date)} ·{" "}
                            {analysis.durationMinutes} min
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <RatingStars value={row.overallRating} />
                        <span className="text-[10px] text-[color:var(--muted-2)]">
                          {row.overallRating}/5
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-[color:var(--muted)] leading-relaxed line-clamp-2">
                      {analysis.overallSummary}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
