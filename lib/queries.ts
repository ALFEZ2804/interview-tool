import { prisma } from "@/lib/db";
import type { SidebarPosition } from "@/lib/types";

export async function getPositionsWithInterviews(): Promise<SidebarPosition[]> {
  const positions = await prisma.position.findMany({
    orderBy: { name: "asc" },
    include: {
      interviews: {
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

  // DTO plano y serializable: estos datos cruzan la frontera server → client.
  return positions.map((p) => ({
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
