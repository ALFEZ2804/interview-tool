import type { AgentReadings, InterviewQuestion } from "@/lib/types";
import { RatingStars } from "./rating-stars";

export function QuestionFeedbackList({
  questions,
}: {
  questions: InterviewQuestion[];
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <header className="px-5 py-4 border-b border-[color:var(--border)] flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
            Feedback por pregunta
          </div>
          <h2 className="text-lg font-semibold mt-1">
            Tus preguntas, evaluadas
          </h2>
          <p className="text-xs text-[color:var(--muted)] mt-1.5">
            Haz click en una pregunta para ver el detalle.
          </p>
        </div>
        <span className="text-xs text-[color:var(--muted)]">
          {questions.length} preguntas
        </span>
      </header>
      <ul className="divide-y divide-[color:var(--border)]">
        {questions.map((q, idx) => (
          <li key={q.id}>
            <QuestionFeedbackItem index={idx + 1} question={q} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuestionFeedbackItem({
  index,
  question,
}: {
  index: number;
  question: InterviewQuestion;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-[color:var(--surface-2)] transition [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="shrink-0 mt-0.5 text-[11px] font-mono text-[color:var(--muted-2)]">
            {String(index).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium leading-relaxed">
            “{question.question}”
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <RatingStars value={question.feedback.rating} />
            <span className="text-[10px] text-[color:var(--muted-2)]">
              {question.feedback.rating}/5
            </span>
          </div>
          <ChevronIcon className="h-4 w-4 text-[color:var(--muted-2)] transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="px-5 pb-5 pt-1 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FeedbackBlock
            title="Lo que funcionó"
            items={question.feedback.strengths}
            tone="positive"
          />
          <FeedbackBlock
            title="A mejorar"
            items={question.feedback.improvements}
            tone="negative"
          />
        </div>

        <AgentReadingsBlock readings={question.feedback.agentReadings} />
      </div>
    </details>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FeedbackBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const dot =
    tone === "positive"
      ? "text-[color:var(--success)]"
      : "text-[color:var(--warning)]";
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)]/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted-2)] mb-2">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className={`${dot} shrink-0 mt-1.5`}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgentReadingsBlock({ readings }: { readings: AgentReadings }) {
  return (
    <div className="rounded-md border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-4 py-3 space-y-3">
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
        Lectura del agente
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ReadingList
          label="Lo bueno"
          items={readings.positive}
          accent="text-[color:var(--success)]"
        />
        <ReadingList
          label="Lo malo"
          items={readings.negative}
          accent="text-[color:var(--danger)]"
        />
      </div>
    </div>
  );
}

function ReadingList({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted-2)] mb-1.5">
        {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className={`${accent} shrink-0 mt-1.5`}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
