import type { SeniorityLevel } from "@/lib/types";

// Orden de presentación de las subcarpetas por seniority (de menor a mayor),
// con "unspecified" al final. Es el orden canónico que usan la página del
// puesto y el sidebar para que las secciones salgan siempre igual.
export const SENIORITY_ORDER: SeniorityLevel[] = [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "unspecified",
];

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  intern: "Becario / Prácticas",
  junior: "Junior",
  mid: "Mid / Semi-senior",
  senior: "Senior",
  lead: "Lead / Principal",
  unspecified: "Sin especificar",
};

// Normaliza cualquier valor (incluido null o un string desconocido venido de la
// BD) a un bucket canónico. Lo desconocido cae en "unspecified" para no romper
// la agrupación si el modelo devolviera algo fuera del enum.
export function toSeniorityLevel(value: string | null | undefined): SeniorityLevel {
  if (value && SENIORITY_ORDER.includes(value as SeniorityLevel)) {
    return value as SeniorityLevel;
  }
  return "unspecified";
}

export function seniorityLabel(value: string | null | undefined): string {
  return SENIORITY_LABELS[toSeniorityLevel(value)];
}

// Agrupa una lista por su seniority y devuelve los grupos en SENIORITY_ORDER,
// omitiendo los niveles vacíos. Genérico para reutilizarlo con entrevistas del
// sidebar y con filas de la página del puesto.
export function groupBySeniority<T>(
  items: T[],
  getLevel: (item: T) => string | null | undefined
): { level: SeniorityLevel; label: string; items: T[] }[] {
  const buckets = new Map<SeniorityLevel, T[]>();
  for (const item of items) {
    const level = toSeniorityLevel(getLevel(item));
    const arr = buckets.get(level);
    if (arr) arr.push(item);
    else buckets.set(level, [item]);
  }
  return SENIORITY_ORDER.filter((level) => buckets.has(level)).map((level) => ({
    level,
    label: SENIORITY_LABELS[level],
    items: buckets.get(level)!,
  }));
}
