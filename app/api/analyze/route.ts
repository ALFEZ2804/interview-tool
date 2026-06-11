import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { PDFParse } from "pdf-parse";
import { interviewSchema } from "@/lib/schema";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { Interview } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

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
      system: INTERVIEW_SYSTEM_PROMPT,
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
