import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { PDFParse } from "pdf-parse";
import { interviewSchema } from "@/lib/schema";
import type { Interview } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres un agente analista de entrevistas para Nova Talent.

Recibes el transcript completo de una entrevista entre un entrevistador (la persona que está usando esta herramienta) y un candidato. Tu trabajo es generar un análisis estructurado siguiendo EXACTAMENTE el schema indicado.

Criterios importantes:

1. Evalúa la POSICIÓN tal como la presentó el entrevistador (no inventes una posición distinta). Reconstruye role.title, responsabilidades, requisitos y nice-to-have a partir de lo que dijo el entrevistador en el pitch inicial. Si el rol no se presenta explícitamente, infiere de forma conservadora.

2. El feedback al pitch debe evaluar al ENTREVISTADOR: claridad, gancho, honestidad, tiempo invertido en stack vs. equipo, si vendió el reto técnico real, etc. Da 1-5 strengths e 1-5 improvements concretos. La sección agentReadings divide la lectura del agente en positive y negative (cada uno con 1-4 puntos).

3. Selecciona las preguntas MÁS RELEVANTES que hizo el entrevistador (máximo 10). Para cada pregunta, el rating evalúa la CALIDAD DE LA PREGUNTA EN SÍ (no la respuesta del candidato): ¿discrimina? ¿es genérica? ¿es ancla al contexto del rol? ¿lleva a follow-ups? Las strengths/improvements describen qué hizo bien y qué puede mejorar de esa pregunta. agentReadings.positive y .negative son las lecturas del agente.

4. overallSummary debe ser 2-3 frases ejecutivas sobre el rendimiento del CANDIDATO, no del entrevistador. overallRating es del candidato.

5. agent (al final) son sugerencias PARA LA PRÓXIMA RONDA, calibradas al rol detectado:
   - killer: preguntas filtro que separan seniors reales (3-5).
   - technical: preguntas técnicas profundas sobre arquitectura/decisiones/herramientas (3-5).
   - business: preguntas sobre criterio de negocio, prioridades y comunicación ejecutiva (3-5).

6. Tono: profesional, directo, español de España. Sin emojis. Sin marketing. Honesto: si una pregunta es mala, dilo.

7. Fechas: si el transcript no indica fecha, usa la fecha de hoy en formato YYYY-MM-DD. status: usa "completed" salvo que sea evidente que la entrevista fue cortada.

8. Si el transcript es claramente muy corto, pobre o no parece una entrevista, igualmente cumple el schema con tus mejores inferencias y refleja en overallSummary que el input fue insuficiente.`;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en .env.local" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No se recibió ningún archivo en el campo 'file'." },
      { status: 400 }
    );
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  const isText =
    file.type.startsWith("text/") ||
    file.name.toLowerCase().endsWith(".txt") ||
    file.name.toLowerCase().endsWith(".vtt");

  if (!isPdf && !isText) {
    return NextResponse.json(
      { error: "Formato no soportado. Sube .pdf, .txt o .vtt." },
      { status: 400 }
    );
  }

  let transcript: string;
  try {
    if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      transcript = result.text?.trim() ?? "";
    } else {
      transcript = (await file.text()).trim();
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "No se pudo leer el archivo.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }

  if (transcript.length < 200) {
    return NextResponse.json(
      {
        error:
          "El transcript es demasiado corto para analizarlo. Asegúrate de que el PDF tiene texto seleccionable (no es una imagen escaneada).",
      },
      { status: 400 }
    );
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const { object } = await generateObject({
      model: openai(modelName),
      schema: interviewSchema,
      schemaName: "InterviewAnalysis",
      system: SYSTEM_PROMPT,
      prompt: `Analiza este transcript de entrevista y genera el análisis estructurado.\n\n---\n${transcript}\n---`,
    });

    const id = `upload-${Date.now()}`;
    const interview: Interview = { id, ...object };

    return NextResponse.json({ interview });
  } catch (err) {
    return NextResponse.json(
      {
        error: "El modelo no pudo generar un análisis válido.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
