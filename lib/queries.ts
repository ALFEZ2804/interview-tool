import { prisma } from "@/lib/db";
import type { SidebarPosition } from "@/lib/types";
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
