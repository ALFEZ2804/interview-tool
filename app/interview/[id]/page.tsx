"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DEMO_INTERVIEW_ID,
  getInterviewById,
} from "@/lib/mock-data";
import type { Interview } from "@/lib/types";
import { RolePresentation } from "@/components/role-presentation";
import { QuestionFeedbackList } from "@/components/question-feedback";
import { PitchFeedbackBlock } from "@/components/pitch-feedback";
import { AgentSuggestionsPanel } from "@/components/agent-suggestions";
import { InterviewTabs } from "@/components/interview-tabs";
import { RatingStars } from "@/components/rating-stars";

const statusLabels = {
  completed: "Cerrada",
  "pending-review": "Pendiente de revisión",
  drafting: "Borrador",
} as const;

type LoadState =
  | { kind: "loading" }
  | { kind: "found"; interview: Interview }
  | { kind: "not-found" };

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (!id) return;

    const fromMock = getInterviewById(id);
    if (fromMock) {
      setState({ kind: "found", interview: fromMock });
      return;
    }

    try {
      const raw = localStorage.getItem(`interview:${id}`);
      if (raw) {
        const interview = JSON.parse(raw) as Interview;
        setState({ kind: "found", interview });
        return;
      }
    } catch {
      // ignore
    }

    setState({ kind: "not-found" });
  }, [id]);

  if (state.kind === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[color:var(--muted)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--border-strong)] border-t-[color:var(--accent)]" />
        <p className="mt-4 text-sm">Cargando entrevista…</p>
      </div>
    );
  }

  if (state.kind === "not-found") {
    return (
      <div className="space-y-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Entrevista no encontrada</h1>
        <p className="text-sm text-[color:var(--muted)] max-w-md mx-auto">
          Esta entrevista no existe o se guardó solo en este navegador y has
          borrado los datos locales.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-[color:var(--accent)] text-black text-sm font-medium px-4 py-2 hover:bg-[color:var(--accent-hover)] transition"
        >
          Subir un transcript
        </Link>
      </div>
    );
  }

  const { interview } = state;
  const isDemo = interview.id === DEMO_INTERVIEW_ID;
  const date = new Date(interview.date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <nav className="text-xs text-[color:var(--muted)] flex items-center gap-3">
        <Link
          href="/"
          className="hover:text-[color:var(--foreground)] transition"
        >
          ← Subir otra entrevista
        </Link>
        {isDemo && (
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
    </div>
  );
}
