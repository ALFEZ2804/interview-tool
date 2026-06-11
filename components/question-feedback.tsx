import type { InterviewQuestion } from "@/lib/types";
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
        </div>
        <span className="text-xs text-[color:var(--muted)]">
          {questions.length} preguntas
        </span>
      </header>
      <ul className="divide-y divide-[color:var(--border)]">
        {questions.map((q, idx) => (
          <li key={q.id} className="px-5 py-5">
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
    <article className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] mb-1">
            Pregunta {String(index).padStart(2, "0")}
          </div>
          <h3 className="text-sm font-medium leading-relaxed">
            “{question.question}”
          </h3>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <RatingStars value={question.feedback.rating} />
          <span className="text-[10px] text-[color:var(--muted-2)]">
            {question.feedback.rating}/5
          </span>
        </div>
      </header>

      <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)]/50 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted-2)] mb-1">
          Respuesta del candidato (resumen)
        </div>
        <p className="text-sm text-[color:var(--foreground)]/80 leading-relaxed">
          {question.candidateAnswer}
        </p>
      </div>

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

      <div className="rounded-md border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-[color:var(--accent)] font-semibold mb-1">
          Lectura del agente
        </div>
        <p className="text-sm leading-relaxed">{question.feedback.note}</p>
      </div>
    </article>
  );
}

function FeedbackBlock({
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
