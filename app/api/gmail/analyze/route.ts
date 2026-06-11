import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { getOAuth2Client } from "@/lib/google-auth";
import { sessionOptions, type GoogleSession } from "@/lib/session";
import { interviewSchema } from "@/lib/schema";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { Interview } from "@/lib/types";
import type { gmail_v1 } from "googleapis";

export const runtime = "nodejs";
export const maxDuration = 60;

// Extrae texto del mensaje de Gmail (body o adjuntos .txt/.vtt)
function extractText(payload: gmail_v1.Schema$MessagePart): string {
  const mimeType = payload.mimeType ?? "";

  if (mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (mimeType.startsWith("multipart/") && payload.parts) {
    for (const part of payload.parts) {
      const text = extractText(part);
      if (text.trim().length > 100) return text;
    }
  }

  return "";
}

// Descarga adjunto y decodifica
async function fetchAttachment(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<string> {
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });
  const data = res.data.data ?? "";
  return Buffer.from(data, "base64").toString("utf-8");
}

// Limpia formato VTT/SRT y devuelve solo el texto de conversación
function cleanVtt(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed === "WEBVTT") return false;
      if (/^\d+$/.test(trimmed)) return false; // número de bloque
      if (/^\d{2}:\d{2}/.test(trimmed)) return false; // timestamp
      return true;
    })
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  const session = await getIronSession<GoogleSession>(
    await cookies(),
    sessionOptions
  );

  if (!session.accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const messageId: string = body.messageId;

  if (!messageId) {
    return NextResponse.json({ error: "Falta messageId" }, { status: 400 });
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiryDate,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Obtener el mensaje completo
  let fullMessage: gmail_v1.Schema$Message;
  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    fullMessage = res.data;
  } catch (err) {
    return NextResponse.json(
      {
        error: "No se pudo obtener el email de Gmail.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }

  const payload = fullMessage.payload;
  let transcript = "";

  // 1. Buscar adjunto .txt o .vtt
  if (payload?.parts) {
    for (const part of payload.parts) {
      const filename = part.filename?.toLowerCase() ?? "";
      const isTranscriptFile =
        filename.endsWith(".txt") || filename.endsWith(".vtt");

      if (isTranscriptFile && part.body?.attachmentId) {
        try {
          const raw = await fetchAttachment(
            gmail,
            messageId,
            part.body.attachmentId
          );
          transcript = filename.endsWith(".vtt") ? cleanVtt(raw) : raw;
          if (transcript.trim().length > 100) break;
        } catch {
          // continúa con el body
        }
      }
    }
  }

  // 2. Si no hay adjunto, extraer del body del email
  if (!transcript && payload) {
    transcript = extractText(payload);
  }

  if (transcript.trim().length < 200) {
    return NextResponse.json(
      {
        error:
          "El transcript encontrado es demasiado corto. Asegúrate de que el email contiene el transcript completo de la reunión.",
      },
      { status: 400 }
    );
  }

  // Usar Gemini si hay clave, sino OpenAI
  const useGemini = !!process.env.GEMINI_API_KEY;
  const useOpenAI = !!process.env.OPENAI_API_KEY;

  if (!useGemini && !useOpenAI) {
    return NextResponse.json(
      { error: "Falta GEMINI_API_KEY o OPENAI_API_KEY en .env.local" },
      { status: 500 }
    );
  }

  const model = useGemini
    ? createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })("gemini-1.5-pro")
    : createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(
        process.env.OPENAI_MODEL ?? "gpt-4o-mini"
      );

  try {
    const { object } = await generateObject({
      model,
      schema: interviewSchema,
      schemaName: "InterviewAnalysis",
      system: INTERVIEW_SYSTEM_PROMPT,
      prompt: `Analiza este transcript de entrevista y genera el análisis estructurado.\n\n---\n${transcript}\n---`,
    });

    const id = `gmail-${messageId}`;
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
