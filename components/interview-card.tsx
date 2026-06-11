import Link from "next/link";
import type { Interview } from "@/lib/types";
import { RatingStars } from "./rating-stars";

const statusLabels: Record<Interview["status"], string> = {
  completed: "Cerrada",
  "pending-review": "Pendiente de revisión",
  drafting: "Borrador",
};

const statusStyles: Record<Interview["status"], string> = {
  completed: "bg-[color:var(--accent-soft)] text-[color:var(--accent)] border-[color:var(--accent-border)]",
  "pending-review": "bg-amber-500/10 text-amber-300 border-amber-500/30",
  drafting: "bg-zinc-700/30 text-zinc-300 border-zinc-600/40",
};

const focusLabels = {
  technical: "Técnica",
  business: "Business",
  mixed: "Mixta",
};

export function InterviewCard({ interview }: { interview: Interview }) {
  const date = new Date(interview.date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/interview/${interview.id}`}
      className="group flex flex-col gap-4 rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border-strong)] text-xs font-semibold text-[color:var(--foreground)]">
            {interview.candidate.avatarInitials}
          </span>
          <div>
            <div className="text-sm font-semibold leading-tight">
              {interview.candidate.name}
            </div>
            <div className="text-xs text-[color:var(--muted)] mt-0.5">
              {interview.candidate.headline}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${statusStyles[interview.status]}`}
        >
          {statusLabels[interview.status]}
        </span>
      </div>

      <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)]/40 px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
          Posición
        </div>
        <div className="text-sm font-medium mt-0.5">{interview.role.title}</div>
        <div className="text-xs text-[color:var(--muted)] mt-1">
          {interview.role.team} · {interview.role.location}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
        <div className="flex items-center gap-3">
          <span>{date}</span>
          <span aria-hidden>·</span>
          <span>{interview.durationMinutes} min</span>
          <span aria-hidden>·</span>
          <span>{focusLabels[interview.role.focus]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RatingStars value={interview.overallRating} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-3 text-xs">
        <span className="text-[color:var(--muted-2)]">
          {interview.questions.length} preguntas analizadas
        </span>
        <span className="font-medium text-[color:var(--accent)] group-hover:translate-x-0.5 transition">
          Ver detalle →
        </span>
      </div>
    </Link>
  );
}
