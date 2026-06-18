import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// Renombra el puesto canónico (al consolidar suele querer fijarse el nombre
// "bueno"). Solo admin. El unique de Position.name se traduce a 409.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!isAdmin(session.email)) {
    return NextResponse.json(
      { error: "Solo un administrador puede renombrar puestos." },
      { status: 403 }
    );
  }

  const { id } = await params;

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "El nombre no puede estar vacío." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.position.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
    return NextResponse.json({ ok: true, position: updated });
  } catch (err) {
    // P2002: violación de unique (ya existe un puesto con ese nombre).
    // P2025: no se encontró el registro a actualizar.
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un puesto con ese nombre." },
        { status: 409 }
      );
    }
    if (code === "P2025") {
      return NextResponse.json(
        { error: "El puesto ya no existe. Recarga la página." },
        { status: 404 }
      );
    }
    console.error("[api/positions/patch]", err);
    return NextResponse.json(
      { error: "No se pudo renombrar el puesto. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
