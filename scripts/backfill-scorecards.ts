import "dotenv/config";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  buildScorecardForRow,
  classifyRow,
  hasScorecard,
  type BackfillRow,
} from "@/lib/scorecard-backfill";

// Backfill one-off del scorecard para entrevistas antiguas. Idempotente: solo
// procesa las que no lo tienen. Uso:
//   npx tsx scripts/backfill-scorecards.ts --dry-run     (no escribe nada)
//   npx tsx scripts/backfill-scorecards.ts --limit 1     (procesa 1, para probar)
//   npx tsx scripts/backfill-scorecards.ts               (todas)

type Args = { dryRun: boolean; limit: number | null };

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");
  const i = argv.indexOf("--limit");
  const raw = i >= 0 ? argv[i + 1] : undefined;
  const n = raw ? parseInt(raw, 10) : NaN;
  return { dryRun, limit: Number.isFinite(n) && n > 0 ? n : null };
}

async function main() {
  const { dryRun, limit } = parseArgs(process.argv.slice(2));

  const all = await prisma.interview.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      candidateName: true,
      sourceDocId: true,
      interviewerEmail: true,
      analysis: true,
    },
  });

  const pending = all.filter((r) => !hasScorecard(r.analysis)) as BackfillRow[];
  console.log(
    `Total: ${all.length} | sin scorecard: ${pending.length} | ya con scorecard: ${all.length - pending.length}`
  );

  const target = limit ? pending.slice(0, limit) : pending;
  if (target.length === 0) {
    console.log("Nada que hacer.");
    await prisma.$disconnect();
    return;
  }

  if (dryRun) {
    let drive = 0;
    let analysis = 0;
    for (const r of target) {
      const src = await classifyRow(r);
      if (src === "drive") drive++;
      else analysis++;
      console.log(`  [~${src}] ${r.candidateName} (${r.id})`);
    }
    console.log(
      `DRY-RUN. A procesar: ${target.length} | estimado por Drive: ${drive} | por análisis: ${analysis}. No se ha escrito nada.`
    );
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let err = 0;
  for (const r of target) {
    try {
      const { scorecard, source } = await buildScorecardForRow(r);
      const nextAnalysis = {
        ...(r.analysis as Record<string, unknown>),
        scorecard,
      };
      await prisma.interview.update({
        where: { id: r.id },
        data: { analysis: nextAnalysis as unknown as Prisma.InputJsonValue },
      });
      ok++;
      console.log(`  ok [${source}] ${r.candidateName} (${r.id})`);
    } catch (e) {
      err++;
      console.log(
        `  ERROR ${r.candidateName} (${r.id}): ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
  console.log(`Hecho. Actualizadas: ${ok} | errores: ${err} | de ${target.length}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
