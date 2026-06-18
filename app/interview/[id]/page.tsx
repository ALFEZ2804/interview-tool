import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInterviewById } from "@/lib/mock-data";
import type { Interview } from "@/lib/types";
import { RolePresentation } from "@/components/role-presentation";
import { QuestionFeedbackList } from "@/components/question-feedback";
import { PitchFeedbackBlock } from "@/components/pitch-feedback";
import { AgentSuggestionsPanel } from "@/components/agent-suggestions";
import { InterviewTabs } from "@/components/interview-tabs";
import { ScorecardPanel } from "@/components/scorecard";
import { RatingStars } from "@/components/rating-stars";
import { getSession, interviewVisibilityFilter, isAdmin } from "@/lib/auth";
import { recommendationConfig } from "@/lib/recommendation";

const statusLabels = {
  completed: "Cerrada",
  "pending-review": "Pendiente de revisión",
  drafting: "Borrador",
} as const;

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  // El ejemplo precargado vive en mock-data, no en la BD.
  const demo = getInterviewById(id);
  let interview: Interview;
  let position: { id: string; name: string } | null = null;

  if (demo) {
    interview = demo;
  } else {
    const row = await prisma.interview.findUnique({
      where: { id },
      include: { position: { select: { id: true, name: true } } },
    });
    if (!row) notFound();

    if (session && !isAdmin(session.email)) {
      const filter = interviewVisibilityFilter(session);
      const allowed =
        row.interviewerEmail === filter.interviewerEmail &&
        row.date >= filter.date.gte;
      if (!allowed) notFound();
    }

    interview = {
      ...(row.analysis as unknown as Omit<Interview, "id">),
      id: row.id,
    };
    position = row.position;
  }

  const recommendation = interview.scorecard
    ? recommendationConfig[interview.scorecard.recommendation]
    : null;
  const date = new Date(interview.date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <nav className="text-xs text-[color:var(--muted)] flex items-center gap-3">
        {position ? (
          <Link
            href={`/position/${position.id}`}
            className="hover:text-[color:var(--foreground)] transition"
          >
            ← {position.name}
          </Link>
        ) : (
          <Link
            href="/new"
            className="hover:text-[color:var(--foreground)] transition"
          >
            ← Subir otra entrevista
          </Link>
        )}
        {demo && (
          <span className="rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
            Demo
          </span>
        )}
      </nav>

      <header className="flex items-start justify-between gap-6 border-b border-[color:var(--border)] pb-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border-strong)] text-base font-semibold">
            {interview.candidate.avatarInitials}
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
              {statusLabels[interview.status]} · {date} ·{" "}
              {interview.durationMinutes} min
            </div>
            <h1 className="text-2xl font-semibold mt-1">
              {interview.candidate.name}
            </h1>
            <div className="text-sm text-[color:var(--muted)] mt-0.5">
              {interview.candidate.headline}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
              Valoración global
            </div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <RatingStars value={interview.overallRating} size="md" />
              <span className="text-sm font-medium">
                {interview.overallRating}/5
              </span>
            </div>
          </div>
          {recommendation && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${recommendation.className}`}
            >
              {recommendation.label}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] mb-2">
          Resumen
        </div>
        <p className="text-sm leading-relaxed">{interview.overallSummary}</p>
      </section>

      <RolePresentation role={interview.role} />

      <InterviewTabs
        feedback={
          <div className="space-y-6">
            <PitchFeedbackBlock pitch={interview.pitchFeedback} />
            <QuestionFeedbackList questions={interview.questions} />
          </div>
        }
        suggestions={
          <AgentSuggestionsPanel
            suggestions={interview.agent}
            roleTitle={interview.role.title}
          />
        }
      />

      {interview.scorecard ? (
        <ScorecardPanel scorecard={interview.scorecard} />
      ) : (
        <p className="text-xs text-[color:var(--muted-2)]">
          Esta entrevista se analizó antes de incorporar el scorecard.
        </p>
      )}
    </div>
  );
}
