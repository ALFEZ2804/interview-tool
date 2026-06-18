import { generateObject } from "ai";
import { z } from "zod";
import { normalizePositionName } from "@/lib/normalize";

// Resolución de a qué Position pertenece una entrevista, para no duplicar el
// mismo rol bajo nombres distintos ("Backend Engineer" vs "Backend Developer").
// Dos niveles, de barato a caro:
//   1. normalizePositionName (lib/normalize): match determinista (casing/acentos/espacios).
//   2. semanticMatchPosition: match semántico con el modelo (sinónimos,
//      traducciones, orden de palabras), conservador (ante la duda, no fusiona).

export type ExistingPosition = { id: string; name: string };

// Nivel 1 — match exacto tras normalizar. Devuelve el puesto existente o null.
export function findByNormalizedName(
  name: string,
  existing: ExistingPosition[]
): ExistingPosition | null {
  const target = normalizePositionName(name);
  if (!target) return null;
  return existing.find((p) => normalizePositionName(p.name) === target) ?? null;
}

// Nivel 2 — match semántico con el modelo. Solo se llama si el nivel 1 no
// encontró nada y hay catálogo. Conservador: si duda, devuelve null (el caller
// crea un puesto nuevo; un duplicado se arregla luego, una fusión errónea no).
export async function semanticMatchPosition({
  candidate,
  existing,
  model,
}: {
  candidate: string;
  existing: ExistingPosition[];
  model: Parameters<typeof generateObject>[0]["model"];
}): Promise<ExistingPosition | null> {
  if (existing.length === 0) return null;

  // Catálogo deduplicado por nombre para construir el enum de opciones.
  const names = Array.from(new Set(existing.map((p) => p.name)));
  // "NONE" primero para que TS lo vea como tupla no vacía [string, ...string[]].
  const options = ["NONE", ...names] as [string, ...string[]];

  let match: string;
  try {
    const { object } = await generateObject({
      model,
      schema: z.object({
        match: z
          .enum(options)
          .describe(
            "Nombre EXACTO del puesto existente que es el MISMO rol que el candidato, o 'NONE' si ninguno lo es."
          ),
      }),
      schemaName: "PositionMatch",
      system:
        "Eres un normalizador de nombres de puestos para un ATS de headhunting. " +
        "Decides si un puesto candidato corresponde al MISMO rol que alguno de los puestos ya existentes. " +
        "Son el MISMO rol: sinónimos (Backend Engineer = Backend Developer = Ingeniero Backend), " +
        "traducciones español/inglés, distinto orden de palabras, mayúsculas o puntuación. " +
        "Son roles DISTINTOS: distinta especialización (Frontend vs Backend, Data Engineer vs Data Analyst) " +
        "o distinta función (Engineer vs Manager). La seniority NO cuenta: ignórala al comparar. " +
        "Si tienes cualquier duda razonable, responde 'NONE': es preferible crear un puesto nuevo " +
        "que fusionar dos roles distintos por error.",
      prompt:
        `Puesto candidato: "${candidate}"\n\n` +
        `Puestos existentes:\n${names.map((n) => `- ${n}`).join("\n")}\n\n` +
        `¿Cuál de los existentes es el MISMO rol que el candidato? Responde con el nombre exacto o 'NONE'.`,
    });
    match = object.match;
  } catch {
    // Si el match semántico falla, no bloqueamos la ingesta: tratamos como
    // "sin match" y el caller creará el puesto. Peor caso: un posible duplicado.
    return null;
  }

  if (match === "NONE") return null;
  return existing.find((p) => p.name === match) ?? null;
}
