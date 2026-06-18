import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// Fusiona uno o varios puestos (sources) dentro de un puesto destino (target):
// mueve todas sus entrevistas al destino y borra los puestos origen, ya vacíos.
// Solo admin. Es la red de seguridad para los duplicados que se escapen de la
// consolidación automática (sinónimos que el modelo no unió, etc.).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!isAdmin(session.email)) {
    return NextResponse.json(
      { error: "Solo un administrador puede fusionar puestos." },
      { status: 403 }
    );
  }

  let body: { targetId?: unknown; sourceIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  const sourceIds = Array.isArray(body.sourceIds)
    ? Array.from(
        new Set(body.sourceIds.filter((s): s is string => typeof s === "string"))
      )
    : [];

  if (!targetId || sourceIds.length === 0) {
    return NextResponse.json(
      { error: "Indica un puesto destino y al menos un puesto a fusionar." },
      { status: 400 }
    );
  }
  if (sourceIds.includes(targetId)) {
    return NextResponse.json(
      { error: "El puesto destino no puede estar entre los puestos a fusionar." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Confirmamos que existen todos (destino + orígenes) antes de mover nada.
      const found = await tx.position.findMany({
        where: { id: { in: [targetId, ...sourceIds] } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((p) => p.id));
      if (!foundIds.has(targetId)) {
        throw new MergeError("El puesto destino ya no existe. Recarga la página.");
      }
      const missing = sourceIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new MergeError(
          "Alguno de los puestos a fusionar ya no existe. Recarga la página."
        );
      }

      const moved = await tx.interview.updateMany({
        where: { positionId: { in: sourceIds } },
        data: { positionId: targetId },
      });
      const deleted = await tx.position.deleteMany({
        where: { id: { in: sourceIds } },
      });

      return {
        movedInterviews: moved.count,
        deletedPositions: deleted.count,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof MergeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[api/positions/merge]", err);
    return NextResponse.json(
      { error: "No se pudieron fusionar los puestos. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}

class MergeError extends Error {}
