import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { analyzeAndStore, AnalyzeError } from "@/lib/analyze";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const positionId = formData.get("positionId");
  const newPositionName = formData.get("newPositionName");

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
      // unpdf usa un build de pdfjs pensado para serverless: no depende de
      // APIs del DOM (DOMMatrix, etc.) ni de binarios nativos, que es justo
      // lo que rompía a pdf-parse en el runtime Node de Vercel.
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(data);
      const { text } = await extractText(pdf, { mergePages: true });
      transcript = text.trim();
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

  try {
    const result = await analyzeAndStore({
      transcript,
      positionId: typeof positionId === "string" ? positionId : null,
      positionName: typeof newPositionName === "string" ? newPositionName : null,
      interviewerEmail: session.email,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnalyzeError) {
      return NextResponse.json(
        { error: err.message, ...(err.details ? { details: err.details } : {}) },
        { status: err.status }
      );
    }
    return NextResponse.json(
      {
        error: "Error inesperado al analizar la entrevista.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
