import { prisma } from "@/lib/db";
import { driveClientForAccount } from "@/lib/google";
import { analyzeAndStore, AnalyzeError } from "@/lib/analyze";

export type IngestSummary = {
  procesados: number;
  saltados: number;
  errores: number;
  detalles: string[];
};

type Account = { email: string; refreshToken: string; ingestSince: Date };

// Parsea "Entrevista - <Posición> - <Candidato> - <fecha> - Notes by Gemini".
// Devuelve { positionName, candidateName } o null si no encaja la convención.
function parseDocName(
  name: string
): { positionName: string; candidateName: string } | null {
  if (!name) return null;
  // Corta a partir del sufijo de Gemini (" - 2026/06/11 ...").
  const head = name.split(/\s[-–]\s\d{4}\//)[0];
  const parts = head.split(/\s[-–]\s/).map((s) => s.trim());
  // Solo entrevistas: el título debe empezar por "Entrevista".
  if (!/entrevista/i.test(parts[0] || "")) return null;
  if (parts.length < 2 || !parts[1]) return null;
  return { positionName: parts[1], candidateName: parts[2] || "" };
}

async function ingestAccount(account: Account, summary: IngestSummary) {
  const drive = driveClientForAccount(account);
  const sinceIso = account.ingestSince.toISOString();

  const res = await drive.files.list({
    q:
      "mimeType='application/vnd.google-apps.document' " +
      "and name contains 'Entrevista' and name contains 'Notes by Gemini' " +
      `and trashed=false and createdTime > '${sinceIso}'`,
    fields: "files(id,name,createdTime)",
    orderBy: "createdTime desc",
    pageSize: 25,
    spaces: "drive",
  });

  const files = res.data.files || [];
  for (const f of files) {
    if (!f.id || !f.name) continue;

    const parsed = parseDocName(f.name);
    if (!parsed) {
      summary.saltados++;
      summary.detalles.push(`skip(nombre): ${f.name}`);
      continue;
    }

    // Dedup: no reprocesar un Doc ya ingerido.
    const existing = await prisma.interview.findUnique({
      where: { sourceDocId: f.id },
      select: { id: true },
    });
    if (existing) {
      summary.saltados++;
      continue;
    }

    try {
      const exp = await drive.files.export(
        { fileId: f.id, mimeType: "text/plain" },
        { responseType: "text" }
      );
      const transcript =
        typeof exp.data === "string" ? exp.data : String(exp.data ?? "");

      await analyzeAndStore({
        transcript,
        positionName: parsed.positionName,
        sourceDocId: f.id,
        interviewerEmail: account.email,
      });
      summary.procesados++;
      summary.detalles.push(`ok [${parsed.positionName}] ${f.name}`);
    } catch (err) {
      summary.errores++;
      const msg =
        err instanceof AnalyzeError
          ? `${err.status} ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      summary.detalles.push(`error: ${f.name} :: ${msg}`);
    }
  }
}

async function ingestAccounts(accounts: Account[]): Promise<IngestSummary> {
  const summary: IngestSummary = {
    procesados: 0,
    saltados: 0,
    errores: 0,
    detalles: [],
  };

  for (const account of accounts) {
    try {
      await ingestAccount(account, summary);
    } catch (err) {
      summary.errores++;
      summary.detalles.push(
        `cuenta ${account.email}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return summary;
}

// Recorre todas las cuentas conectadas (lo usa el cron). Diseñado para 1 o N.
export async function ingestAllAccounts(): Promise<IngestSummary> {
  const accounts = await prisma.googleAccount.findMany({
    select: { email: true, refreshToken: true, ingestSince: true },
  });
  return ingestAccounts(accounts);
}

// Ingiere solo la cuenta indicada (botón "Sincronizar mis entrevistas" del HH).
export async function ingestByEmail(email: string): Promise<IngestSummary> {
  const accounts = await prisma.googleAccount.findMany({
    where: { email },
    select: { email: true, refreshToken: true, ingestSince: true },
  });
  return ingestAccounts(accounts);
}
