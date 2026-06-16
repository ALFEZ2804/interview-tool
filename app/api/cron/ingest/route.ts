import { NextRequest, NextResponse } from "next/server";
import { ingestAllAccounts } from "@/lib/drive-ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

// Protegido con INGEST_SECRET, vía ?key=, cabecera x-ingest-secret o
// Authorization: Bearer. Pensado para un pinger externo (cron-job.org) que lo
// llame cada ~15 min.
function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return false;
  const key = new URL(req.url).searchParams.get("key");
  const header = req.headers.get("x-ingest-secret");
  const auth = req.headers.get("authorization");
  return key === secret || header === secret || auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const summary = await ingestAllAccounts();
  return NextResponse.json(summary);
}

export const POST = GET;
