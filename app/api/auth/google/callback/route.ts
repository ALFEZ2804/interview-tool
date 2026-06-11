import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google-auth";
import { sessionOptions, type GoogleSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const base = new URL("/", request.url).toString();

  if (error || !code) {
    return NextResponse.redirect(`${base}?gmail_error=auth_cancelled`);
  }

  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    const session = await getIronSession<GoogleSession>(
      await cookies(),
      sessionOptions
    );
    session.accessToken = tokens.access_token ?? undefined;
    session.refreshToken = tokens.refresh_token ?? undefined;
    session.expiryDate = tokens.expiry_date ?? undefined;
    session.email = data.email ?? undefined;
    await session.save();

    return NextResponse.redirect(base);
  } catch {
    return NextResponse.redirect(`${base}?gmail_error=token_exchange_failed`);
  }
}
