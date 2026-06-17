import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { z } from "zod";
import { scorecardSchema } from "@/lib/schema";
import { prisma } from "@/lib/db";
import { driveClientForAccount } from "@/lib/google";

// Backfill del scorecard para entrevistas analizadas antes de que existiera el
// campo. Reutiliza el mismo schema de generación (lib/schema) y el mismo modelo
// que lib/analyze. Híbrido: transcript real desde Drive si la entrevista vino de
// la ingesta automática (sourceDocId); si no, reconstrucción desde el análisis
// ya guardado.

export type GeneratedScorecard = z.infer<typeof scorecardSchema>;
export type BackfillSource = "drive" | "analysis";

export type BackfillRow = {
  id: string;
  candidateName: string;
  sourceDocId: string | null;
  interviewerEmail: string | null;
  analysis: unknown;
};

const SYSTEM_PROMPT = `Eres un agente analista de entrevistas para Nova Talent. Tu única tarea es generar el SCORECARD de competencias del CANDIDATO siguiendo EXACTAMENTE el schema.

Reglas:
- 3 a 6 competencias calibradas al rol detectado (ej. profundidad técnica, comunicación, ownership, fit con el equipo).
- Cada competencia lleva score 1-5, un peso en % y un rationale anclado a evidencia concreta (no genérico).
- Los pesos DEBEN sumar exactamente 100.
- recommendation ("strong-yes" | "yes" | "mixed" | "no") debe ser coherente con overallRating: si el rating es bajo, no puede ser "strong-yes".
- Tono profesional, directo, español de España. Sin emojis.`;

function model() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(process.env.OPENAI_MODEL || "gpt-4o-mini");
}

export async function generateScorecardFromTranscript(
  transcript: string,
  analysis: unknown
): Promise<GeneratedScorecard> {
  const { object } = await generateObject({
    model: model(),
    schema: scorecardSchema,
    schemaName: "Scorecard",
    system: SYSTEM_PROMPT,
    prompt:
      `Genera el scorecard del candidato a partir del transcript de la entrevista y del análisis ya realizado.\n\n` +
      `ANÁLISIS PREVIO (JSON):\n${JSON.stringify(analysis)}\n\n` +
      `TRANSCRIPT:\n---\n${transcript.trim()}\n---`,
  });
  return object;
}

export async function generateScorecardFromAnalysis(
  analysis: unknown
): Promise<GeneratedScorecard> {
  const { object } = await generateObject({
    model: model(),
    schema: scorecardSchema,
    schemaName: "Scorecard",
    system: SYSTEM_PROMPT,
    prompt:
      `No se conserva el transcript original de esta entrevista. Reconstruye un scorecard coherente ` +
      `a partir del análisis estructurado ya generado (rol, valoración global, resumen, preguntas y feedback). ` +
      `Debe ser coherente con overallRating.\n\n` +
      `ANÁLISIS (JSON):\n${JSON.stringify(analysis)}`,
  });
  return object;
}

export function hasScorecard(analysis: unknown): boolean {
  return (
    !!analysis &&
    typeof analysis === "object" &&
    "scorecard" in analysis &&
    !!(analysis as { scorecard?: unknown }).scorecard
  );
}

// Re-descarga el Doc de Gemini desde Drive usando el refresh token de la cuenta
// que capturó la entrevista. Devuelve null si no hay cuenta o el texto es pobre.
export async function fetchTranscriptFromDrive(
  sourceDocId: string,
  interviewerEmail: string | null
): Promise<string | null> {
  if (!interviewerEmail) return null;
  const account = await prisma.googleAccount.findUnique({
    where: { email: interviewerEmail },
    select: { refreshToken: true },
  });
  if (!account) return null;
  const drive = driveClientForAccount(account);
  const exp = await drive.files.export(
    { fileId: sourceDocId, mimeType: "text/plain" },
    { responseType: "text" }
  );
  const text = typeof exp.data === "string" ? exp.data : String(exp.data ?? "");
  return text.trim() || null;
}

// Clasificación barata para el dry-run: ¿podría ir por Drive? (sin descargar).
export async function classifyRow(row: BackfillRow): Promise<BackfillSource> {
  if (row.sourceDocId && row.interviewerEmail) {
    const account = await prisma.googleAccount.findUnique({
      where: { email: row.interviewerEmail },
      select: { email: true },
    });
    if (account) return "drive";
  }
  return "analysis";
}

// Genera el scorecard con la mejor fuente disponible; si Drive falla, cae a la
// reconstrucción desde el análisis (nunca lanza por culpa de Drive).
export async function buildScorecardForRow(
  row: BackfillRow
): Promise<{ scorecard: GeneratedScorecard; source: BackfillSource }> {
  if (row.sourceDocId) {
    try {
      const transcript = await fetchTranscriptFromDrive(
        row.sourceDocId,
        row.interviewerEmail
      );
      if (transcript && transcript.length >= 200) {
        const scorecard = await generateScorecardFromTranscript(
          transcript,
          row.analysis
        );
        return { scorecard, source: "drive" };
      }
    } catch {
      // Drive inaccesible o token caducado: caemos a reconstrucción.
    }
  }
  const scorecard = await generateScorecardFromAnalysis(row.analysis);
  return { scorecard, source: "analysis" };
}
