import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// Clasificador barato: decide si una nota de Gemini es una entrevista de
// selección. Solo manda el fragmento inicial al modelo más barato, así filtrar
// todas las reuniones cuesta una fracción de céntimo; el análisis completo (caro)
// se reserva para las que pasan este filtro.
const schema = z.object({
  esEntrevista: z
    .boolean()
    .describe(
      "true SOLO si la nota corresponde a una entrevista de selección a una persona candidata para un puesto. NO lo son: dailies, 1:1 internos, demos, reuniones de equipo, kick-offs, llamadas comerciales/ventas."
    ),
});

// Nivel 1 — por título de la reunión. El equipo agenda las entrevistas con un
// puñado de títulos conocidos; si el Doc los lleva, es entrevista sin gastar el
// clasificador de IA. Genéricos a propósito (no traen puesto ni nombre): el
// puesto se sigue derivando del transcript en el análisis.
//
//   "Headhunting Interview", "Headhunting Interview Nova", "Interview"  -> interview
//   "Entrevista"                                                        -> entrevista
//   "Let's Talk!", "Let's Talk (meets)"                                 -> lets talk
const INTERVIEW_TITLE_PATTERNS = ["entrevista", "interview", "lets talk"];

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’`´]/g, "") // apóstrofos rectos y tipográficos -> nada (let's -> lets)
    .replace(/\s+/g, " ")
    .trim();
}

export function isInterviewTitle(docName: string): boolean {
  // El Doc de Gemini se llama "<título de la reunión> - Notes by Gemini". Quito
  // ese sufijo (en inglés o español) para no clasificar sobre él.
  const title = normalizeTitle(
    docName.replace(/\s*[-–—]\s*(notes by gemini|notas de gemini).*$/i, "")
  );
  return INTERVIEW_TITLE_PATTERNS.some((p) => title.includes(p));
}

export async function isInterviewDoc(text: string): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) return false;
  const sample = text.replace(/\s+/g, " ").trim().slice(0, 6000);
  if (sample.length < 100) return false; // nota vacía o demasiado corta

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = openai(
    process.env.OPENAI_CLASSIFY_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini"
  );

  const { object } = await generateObject({
    model,
    schema,
    schemaName: "ClasificacionEntrevista",
    system:
      "Clasificas notas de reuniones de Google Meet generadas por Gemini. Indica si la nota corresponde a una ENTREVISTA DE SELECCIÓN a una persona candidata para un puesto de trabajo (entrevistador evaluando a un candidato). No son entrevistas: dailies, 1:1 internos, demos, reuniones de equipo, kick-offs ni llamadas comerciales.",
    prompt: `Fragmento inicial de la nota de la reunión:\n---\n${sample}\n---`,
  });

  return object.esEntrevista;
}
