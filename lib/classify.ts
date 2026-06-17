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
