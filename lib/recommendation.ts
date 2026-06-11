import type { CompetencyScore, Recommendation } from "./types";

export const recommendationConfig: Record<
  Recommendation,
  { label: string; shortLabel: string; className: string }
> = {
  "strong-yes": {
    label: "Avanzar con convicción",
    shortLabel: "Avanzar ++",
    className:
      "border-[color:var(--success)] text-[color:var(--success)] bg-[color:var(--success)]/10",
  },
  yes: {
    label: "Avanzar",
    shortLabel: "Avanzar",
    className:
      "border-[color:var(--accent-border)] text-[color:var(--accent)] bg-[color:var(--accent-soft)]",
  },
  mixed: {
    label: "Mixto · pasar a referencias",
    shortLabel: "Mixto",
    className:
      "border-[color:var(--warning)] text-[color:var(--warning)] bg-[color:var(--warning)]/10",
  },
  no: {
    label: "No avanzar",
    shortLabel: "No avanzar",
    className:
      "border-[color:var(--danger)] text-[color:var(--danger)] bg-[color:var(--danger)]/10",
  },
};

export function weightedScore(competencies: CompetencyScore[]): number {
  const totalWeight = competencies.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = competencies.reduce((sum, c) => sum + c.score * c.weight, 0);
  return weighted / totalWeight;
}
