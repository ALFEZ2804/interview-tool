import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { interviewSchema } from "@/lib/schema";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

// Error con código HTTP asociado, para que cada ruta (subida manual o ingesta
// automática) lo traduzca a su respuesta sin repetir la lógica de negocio.
export class AnalyzeError extends Error {
  status: number;
  details?: string;
  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = "AnalyzeError";
    this.status = status;
    this.details = details;
  }
}

const SYSTEM_PROMPT = `Eres un agente analista de entrevistas para Nova Talent.

Recibes el transcript completo de una entrevista entre un entrevistador (la persona que está usando esta herramienta) y un candidato. Tu trabajo es generar un análisis estructurado siguiendo EXACTAMENTE el schema indicado.

Criterios importantes:

1. Evalúa la POSICIÓN tal como la presentó el entrevistador (no inventes una posición distinta). Reconstruye role.title, responsabilidades, requisitos y nice-to-have a partir de lo que dijo el entrevistador en el pitch inicial. Si el rol no se presenta explícitamente, infiere de forma conservadora.

2. El feedback al pitch debe evaluar al ENTREVISTADOR: claridad, gancho, honestidad, tiempo invertido en stack vs. equipo, si vendió el reto técnico real, etc. Da 1-5 strengths e 1-5 improvements concretos. La sección agentReadings divide la lectura del agente en positive y negative (cada uno con 1-4 puntos).

3. Extrae TODAS las preguntas que hizo el entrevistador, en orden cronológico. No omitas ninguna pregunta real; solo descarta muletillas o confirmaciones triviales ("¿me oyes?", "¿vale?"). Agrupa una pregunta y sus follow-ups inmediatos sobre el mismo tema como una sola entrada. Para cada pregunta, el rating evalúa la CALIDAD DE LA PREGUNTA EN SÍ (no la respuesta del candidato): ¿discrimina? ¿es genérica? ¿es ancla al contexto del rol? ¿lleva a follow-ups? Las strengths/improvements describen qué hizo bien y qué puede mejorar de esa pregunta. agentReadings.positive y .negative son las lecturas del agente.

4. overallSummary debe ser 2-3 frases ejecutivas sobre el rendimiento del CANDIDATO, no del entrevistador. overallRating es del candidato.

5. agent (al final) son sugerencias PARA LA PRÓXIMA RONDA, calibradas al rol detectado:
   - killer: preguntas filtro que separan seniors reales (3-5).
   - technical: preguntas técnicas profundas sobre arquitectura/decisiones/herramientas (3-5).
   - business: preguntas sobre criterio de negocio, prioridades y comunicación ejecutiva (3-5).

6. Tono: profesional, directo, español de España. Sin emojis. Sin marketing. Honesto: si una pregunta es mala, dilo.

7. Fechas: si el transcript no indica fecha, usa la fecha de hoy en formato YYYY-MM-DD. status: usa "completed" salvo que sea evidente que la entrevista fue cortada.

8. Si el transcript es claramente muy corto, pobre o no parece una entrevista, igualmente cumple el schema con tus mejores inferencias y refleja en overallSummary que el input fue insuficiente.`;

export type AnalyzeInput = {
  transcript: string;
  positionId?: string | null;
  positionName?: string | null;
};

export type AnalyzeResult = {
  interviewId: string;
  positionId: string;
};

// Núcleo compartido: valida la posición, genera el análisis con el modelo y lo
// persiste como Interview (creando la Position por nombre si hace falta).
// Lanza AnalyzeError(status, message) en cualquier fallo esperable.
export async function analyzeAndStore({
  transcript,
  positionId,
  positionName,
}: AnalyzeInput): Promise<AnalyzeResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new AnalyzeError(500, "Falta OPENAI_API_KEY en .env");
  }

  const wantsExisting = typeof positionId === "string" && positionId.length > 0;
  const wantsNew =
    typeof positionName === "string" && positionName.trim().length > 0;

  if (!wantsExisting && !wantsNew) {
    throw new AnalyzeError(
      400,
      "Indica la posición: selecciona una existente o crea una nueva."
    );
  }

  // Validamos la posición antes de gastar la llamada al modelo, pero la
  // creación de posiciones nuevas se hace después del análisis para no dejar
  // posiciones vacías si el análisis falla.
  if (wantsExisting) {
    const exists = await prisma.position.findUnique({
      where: { id: positionId as string },
      select: { id: true },
    });
    if (!exists) {
      throw new AnalyzeError(
        400,
        "La posición seleccionada ya no existe. Recarga la página."
      );
    }
  }

  const text = transcript.trim();
  if (text.length < 200) {
    throw new AnalyzeError(
      400,
      "El transcript es demasiado corto para analizarlo. Asegúrate de que el PDF tiene texto seleccionable (no es una imagen escaneada)."
    );
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

  let analysis;
  try {
    const { object } = await generateObject({
      model: openai(modelName),
      schema: interviewSchema,
      schemaName: "InterviewAnalysis",
      system: SYSTEM_PROMPT,
      prompt: `Analiza este transcript de entrevista y genera el análisis estructurado.\n\n---\n${text}\n---`,
    });
    analysis = object;
  } catch (err) {
    throw new AnalyzeError(
      502,
      "El modelo no pudo generar un análisis válido.",
      err instanceof Error ? err.message : String(err)
    );
  }

  try {
    // upsert por nombre: si la posición "nueva" ya existía, reutilizamos la
    // existente en vez de fallar por el unique constraint.
    const position = wantsExisting
      ? { id: positionId as string }
      : await prisma.position.upsert({
          where: { name: (positionName as string).trim() },
          update: {},
          create: { name: (positionName as string).trim() },
          select: { id: true },
        });

    const parsedDate = new Date(analysis.date);
    const row = await prisma.interview.create({
      data: {
        positionId: position.id,
        candidateName: analysis.candidate.name,
        date: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        overallRating: analysis.overallRating,
        status: analysis.status,
        analysis: analysis as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, positionId: true },
    });

    return { interviewId: row.id, positionId: row.positionId };
  } catch (err) {
    throw new AnalyzeError(
      500,
      "El análisis se generó pero no se pudo guardar en la base de datos. ¿Está configurada DATABASE_URL en .env?",
      err instanceof Error ? err.message : String(err)
    );
  }
}
