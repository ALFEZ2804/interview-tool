import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, interviewVisibilityFilter, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// Borra una entrevista. Mismo modelo de autorización que la vista de detalle:
// el admin puede borrar cualquiera; el resto, solo las suyas dentro de la
// ventana de visibilidad. Se usa deleteMany con el filtro para que un usuario
// no pueda eliminar entrevistas ajenas adivinando el id (count 0 → 404).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const where = isAdmin(session.email)
    ? { id }
    : { id, ...interviewVisibilityFilter(session) };

  try {
    const { count } = await prisma.interview.deleteMany({ where });
    if (count === 0) {
      return NextResponse.json(
        {
          error:
            "No se encontró la entrevista o no tienes permiso para eliminarla.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/interviews/delete]", err);
    return NextResponse.json(
      { error: "No se pudo eliminar la entrevista. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
