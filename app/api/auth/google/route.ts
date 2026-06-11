import { NextResponse } from "next/server";
import { getOAuth2Client, GMAIL_SCOPES } from "@/lib/google-auth";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env.local" },
      { status: 500 }
    );
  }

  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
  });

  return NextResponse.redirect(url);
}
