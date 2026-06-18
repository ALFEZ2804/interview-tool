import { prisma } from "@/lib/db";
import type { Interview, RecentInterview, SidebarPosition } from "@/lib/types";
import {
  type Session,
  interviewVisibilityFilter,
  isAdmin,
} from "@/lib/auth";

export async function getPositionsWithInterviews(
  session?: Session | null
): Promise<SidebarPosition[]> {
  const interviewWhere =
    session && !isAdmin(session.email)
      ? interviewVisibilityFilter(session)
      : undefined;

  const positions = await prisma.position.findMany({
    orderBy: { name: "asc" },
    include: {
      interviews: {
        where: interviewWhere,
        orderBy: { date: "desc" },
        select: {
          id: true,
          candidateName: true,
          date: true,
          overallRating: true,
        },
      },
    },
  });

  // Sin entrevistas visibles, la posición no aparece en el sidebar.
  const visible = session && !isAdmin(session.email)
    ? positions.filter((p) => p.interviews.length > 0)
    : positions;

  return visible.map((p) => ({
    id: p.id,
    name: p.name,
    interviews: p.interviews.map((i) => ({
      id: i.id,
      candidateName: i.candidateName,
      date: i.date.toISOString(),
      overallRating: i.overallRating,
    })),
  }));
}

// Entrevistas para el dashboard de la home. Filtra por texto (nombre del
// candidato o de la posición) y/o por posición, respetando la visibilidad de la
// sesión. Devuelve lo aplanado que necesita la card, sin arrastrar el análisis.
export async function getRecentInterviews(
  session: Session | null,
  opts: { q?: string; positionId?: string; limit?: number } = {}
): Promise<RecentInterview[]> {
  const visibility =
    session && !isAdmin(session.email)
      ? interviewVisibilityFilter(session)
      : {};

  const and: Record<string, unknown>[] = [visibility];
  if (opts.positionId) and.push({ positionId: opts.positionId });

  const q = opts.q?.trim();
  if (q) {
    and.push({
      OR: [
        { candidateName: { contains: q, mode: "insensitive" } },
        { position: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const interviews = await prisma.interview.findMany({
    where: { AND: and },
    orderBy: { date: "desc" },
    take: opts.limit ?? 60,
    select: {
      id: true,
      candidateName: true,
      positionId: true,
      date: true,
      overallRating: true,
      status: true,
      analysis: true,
      position: { select: { name: true } },
    },
  });

  return interviews.map((i) => {
    const a = i.analysis as unknown as Omit<Interview, "id">;
    return {
      id: i.id,
      candidateName: i.candidateName,
      positionId: i.positionId,
      positionName: i.position.name,
      date: i.date.toISOString(),
      overallRating: i.overallRating,
      status: i.status,
      headline: a?.candidate?.headline ?? "",
      avatarInitials: a?.candidate?.avatarInitials ?? initials(i.candidateName),
      summary: a?.overallSummary ?? "",
      durationMinutes: a?.durationMinutes ?? 0,
    };
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
