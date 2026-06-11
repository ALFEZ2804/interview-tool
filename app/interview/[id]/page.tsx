import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllInterviewIds, getInterviewById } from "@/lib/mock-data";
import { RolePresentation } from "@/components/role-presentation";
import { Transcript } from "@/components/transcript";
import { QuestionFeedbackList } from "@/components/question-feedback";
import { AgentSuggestionsPanel } from "@/components/agent-suggestions";
import { ScorecardPanel } from "@/components/scorecard";
import { RatingStars } from "@/components/rating-stars";
import { recommendationConfig } from "@/lib/recommendation";

export function generateStaticParams() {
  return getAllInterviewIds().map((id) => ({ id }));
}

const statusLabels = {
  completed: "Cerrada",
  "pending-review": "Pendiente de revisión",
  drafting: "Borrador",
} as const;

export default async function InterviewPage(
  props: PageProps<"/interview/[id]">
) {
  const { id } = await props.params;
  const interview = getInterviewById(id);
  if (!interview) notFound();

  const date = new Date(interview.date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <nav className="text-xs text-[color:var(--muted)]">
        <Link
          href="/"
          className="hover:text-[color:var(--foreground)] transition"
        >
          ← Entrevistas
        </Link>
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
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${recommendationConfig[interview.scorecard.recommendation].className}`}
          >
            {recommendationConfig[interview.scorecard.recommendation].label}
          </span>
        </div>
      </header>

      <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] mb-2">
          Resumen
        </div>
        <p className="text-sm leading-relaxed">{interview.overallSummary}</p>
      </section>

      <RolePresentation role={interview.role} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QuestionFeedbackList questions={interview.questions} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <AgentSuggestionsPanel
            suggestions={interview.agent}
            roleTitle={interview.role.title}
          />
          <Transcript lines={interview.transcript} />
        </div>
      </div>

      <ScorecardPanel scorecard={interview.scorecard} />
    </div>
  );
}
