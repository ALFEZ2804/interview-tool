import type { CompetencyScore, Scorecard } from "@/lib/types";
import { recommendationConfig, weightedScore } from "@/lib/recommendation";
import { RatingStars } from "./rating-stars";

function scoreColor(score: number): string {
  if (score >= 4) return "var(--success)";
  if (score >= 3) return "var(--warning)";
  return "var(--danger)";
}

export function ScorecardPanel({ scorecard }: { scorecard: Scorecard }) {
  const { competencies, recommendation } = scorecard;
  const rec = recommendationConfig[recommendation];
  const overall = weightedScore(competencies);

  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <header className="px-5 py-4 border-b border-[color:var(--border)] flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
            Scorecard de competencias
          </div>
          <h2 className="text-lg font-semibold mt-1">
            Evaluación ponderada por competencia
          </h2>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted-2)]">
              Score ponderado
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <RatingStars value={Math.round(overall)} size="md" />
              <span className="text-sm font-medium tabular-nums">
                {overall.toFixed(1)}/5
              </span>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${rec.className}`}
          >
            {rec.label}
          </span>
        </div>
      </header>

      <ul className="divide-y divide-[color:var(--border)]">
        {competencies.map((c) => (
          <li key={c.name} className="px-5 py-4">
            <CompetencyRow competency={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CompetencyRow({ competency }: { competency: CompetencyScore }) {
  const { name, score, weight, rationale } = competency;
  const color = scoreColor(score);

  return (
    <article className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium">{name}</h3>
          <span className="text-[10px] uppercase tracking-wide text-[color:var(--muted-2)]">
            peso {weight}%
          </span>
        </div>
        <span className="text-xs font-medium tabular-nums" style={{ color }}>
          {score}/5
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={name}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / 5) * 100}%`, background: color }}
        />
      </div>

      <p className="text-sm leading-relaxed text-[color:var(--foreground)]/80">
        {rationale}
      </p>
    </article>
  );
}
