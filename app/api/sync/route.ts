import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ingestByEmail } from "@/lib/drive-ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ingesta manual disparada por el propio usuario desde la UI: procesa solo su
// cuenta de Google (no la de los demás). El cron sigue cubriendo la global.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const summary = await ingestByEmail(session.email);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[api/sync]", err);
    return NextResponse.json(
      { error: "No se pudo sincronizar. Inténtalo de nuevo en un momento." },
      { status: 500 }
    );
  }
}
