import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google-auth";
import { sessionOptions, type GoogleSession } from "@/lib/session";

export interface GmailTranscript {
  id: string;
  subject: string;
  date: string;
  from: string;
  snippet: string;
}

// Busca emails de transcripts de Google Meet / Gemini
// Google Meet manda los transcripts desde meet-recordings-noreply@google.com
const TRANSCRIPT_QUERY =
  'from:meet-recordings-noreply@google.com OR (subject:"transcript" has:attachment) OR subject:"Notas de la reunión" OR subject:"Meeting notes"';

export async function GET() {
  const session = await getIronSession<GoogleSession>(
    await cookies(),
    sessionOptions
  );

  if (!session.accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiryDate,
  });

  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: TRANSCRIPT_QUERY,
      maxResults: 15,
    });

    const messages = listRes.data.messages ?? [];

    if (messages.length === 0) {
      return NextResponse.json({ transcripts: [], email: session.email });
    }

    const transcripts: GmailTranscript[] = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "Date", "From"],
        });

        const headers = detail.data.payload?.headers ?? [];
        const get = (name: string) =>
          headers.find((h) => h.name === name)?.value ?? "";

        return {
          id: msg.id!,
          subject: get("Subject") || "Sin asunto",
          date: get("Date"),
          from: get("From"),
          snippet: detail.data.snippet ?? "",
        };
      })
    );

    return NextResponse.json({ transcripts, email: session.email });
  } catch (err: unknown) {
    // Token expirado o revocado
    const status =
      err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 0;
    if (status === 401) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: "Error al acceder a Gmail",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
