import { NextResponse } from "next/server";
import { analyzeAndStore, AnalyzeError } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ingesta automática (p.ej. desde el Apps Script que lee las transcripciones de
// Gemini en Drive). Recibe el transcript ya en texto plano + el nombre de la
// posición extraído del título, y reutiliza el mismo núcleo que la subida web.
export async function POST(request: Request) {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INGEST_SECRET no está configurado en el servidor." },
      { status: 500 }
    );
  }
  if (request.headers.get("x-ingest-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido: se esperaba JSON." },
      { status: 400 }
    );
  }

  const { transcript, positionName } = (body ?? {}) as {
    transcript?: unknown;
    positionName?: unknown;
  };

  if (
    typeof transcript !== "string" ||
    typeof positionName !== "string" ||
    positionName.trim().length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Faltan campos: 'transcript' (string) y 'positionName' (string no vacío).",
      },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeAndStore({ transcript, positionName });
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
        error: "Error inesperado al ingerir la entrevista.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
