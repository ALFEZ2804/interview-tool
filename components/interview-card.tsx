import Link from "next/link";
import type { RecentInterview } from "@/lib/types";
import { RatingStars } from "@/components/rating-stars";
import { seniorityLabel } from "@/lib/seniority";

const statusLabels: Record<string, string> = {
  completed: "Cerrada",
  "pending-review": "Pendiente",
  drafting: "Borrador",
};

export function InterviewCard({
  interview,
  index = 0,
}: {
  interview: RecentInterview;
  index?: number;
}) {
  const {
    id,
    candidateName,
    positionName,
    headline,
    summary,
    date,
    seniorityLevel,
  } = interview;

  return (
    <Link
      href={`/interview/${id}`}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      className="card-reveal group relative flex flex-col overflow-hidden rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-2)] hover:shadow-[0_18px_40px_-20px_rgba(14,176,164,0.45)]"
    >
      {/* Resplandor sutil que aparece al hover, ancla la identidad Nova. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[color:var(--accent)] opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-10"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--background)] text-xs font-semibold text-[color:var(--foreground)]">
            {interview.avatarInitials}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[color:var(--foreground)]">
              {candidateName}
            </div>
            {headline && (
              <div className="truncate text-xs text-[color:var(--muted)]">
                {headline}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <RatingStars value={interview.overallRating} />
          <span className="text-[10px] text-[color:var(--muted-2)]">
            {interview.overallRating}/5
          </span>
        </div>
      </div>

      {summary && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[color:var(--muted)]">
          {summary}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 pt-3 text-[11px] text-[color:var(--muted-2)]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex max-w-[11rem] items-center gap-1.5 truncate rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-2.5 py-1 font-medium text-[color:var(--accent)]">
            <span className="truncate">{positionName}</span>
          </span>
          {seniorityLevel && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2 py-1 font-medium text-[color:var(--muted)]">
              {seniorityLabel(seniorityLevel)}
            </span>
          )}
        </span>
        <span className="shrink-0">
          {statusLabels[interview.status] ?? interview.status} ·{" "}
          {formatDate(date)}
        </span>
      </div>
    </Link>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
