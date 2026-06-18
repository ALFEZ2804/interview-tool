import { prisma } from "@/lib/db";
import { driveClientForAccount } from "@/lib/google";
import { analyzeAndStore, AnalyzeError } from "@/lib/analyze";
import { looksLikeInterview, isInterviewTitle } from "@/lib/classify";

export type IngestSummary = {
  procesados: number;
  saltados: number;
  errores: number;
  detalles: string[];
};

type Account = { email: string; refreshToken: string; ingestSince: Date };

async function ingestAccount(account: Account, summary: IngestSummary) {
  const drive = driveClientForAccount(account);
  const sinceIso = account.ingestSince.toISOString();

  // Todas las notas de Gemini nuevas (el sufijo "Notes by Gemini"/"Notas de
  // Gemini" lo pone Google, no el headhunter). No filtramos por el nombre de la
  // reunión: de eso se encarga el clasificador por contenido más abajo.
  const res = await drive.files.list({
    q:
      "mimeType='application/vnd.google-apps.document' " +
      "and (name contains 'Notes by Gemini' or name contains 'Notas de Gemini') " +
      `and trashed=false and createdTime > '${sinceIso}'`,
    fields: "files(id,name,createdTime)",
    orderBy: "createdTime", // ascendente: del más antiguo al más nuevo (para el cursor)
    pageSize: 25,
    spaces: "drive",
  });

  const files = res.data.files || [];
  // Cursor incremental: avanzamos ingestSince hasta el último Doc resuelto para
  // no reprocesar (ni reclasificar) en cada pasada del cron.
  let cursor = account.ingestSince;
  const advance = (created: Date | null) => {
    if (created && created.getTime() > cursor.getTime()) cursor = created;
  };

  for (const f of files) {
    if (!f.id || !f.name) continue;
    const created = f.createdTime ? new Date(f.createdTime) : null;

    // Dedup: no reprocesar un Doc ya ingerido.
    const existing = await prisma.interview.findUnique({
      where: { sourceDocId: f.id },
      select: { id: true },
    });
    if (existing) {
      summary.saltados++;
      advance(created);
      continue;
    }

    // Exportar el texto del Doc.
    let transcript: string;
    try {
      const exp = await drive.files.export(
        { fileId: f.id, mimeType: "text/plain" },
        { responseType: "text" }
      );
      transcript =
        typeof exp.data === "string" ? exp.data : String(exp.data ?? "");
    } catch {
      // Error transitorio de Drive: paramos sin avanzar el cursor para
      // reintentar este Doc en la próxima pasada.
      summary.errores++;
      summary.detalles.push(`export-error (reintentar): ${f.name}`);
      break;
    }

    // Nivel 1 (título) y Nivel 2 (heurística LOCAL, sin OpenAI). El contenido de
    // reuniones que no son entrevistas se procesa solo en nuestro servidor para
    // decidir y nunca se envía a OpenAI; solo el transcript ya confirmado como
    // entrevista llega al análisis.
    const byTitle = isInterviewTitle(f.name);
    const esEntrevista = byTitle || looksLikeInterview(transcript);

    if (!esEntrevista) {
      summary.saltados++;
      summary.detalles.push(`no-entrevista (local): ${f.name}`);
      advance(created);
      continue;
    }

    // Análisis completo + guardado. La posición y el candidato salen del
    // contenido (lib/analyze deriva la posición de role.title si no se indica).
    try {
      await analyzeAndStore({
        transcript,
        sourceDocId: f.id,
        interviewerEmail: account.email,
        date: f.createdTime ?? null, // fecha fiable del Doc, no la del modelo
      });
      summary.procesados++;
      summary.detalles.push(`ok (${byTitle ? "titulo" : "local"}): ${f.name}`);
      advance(created);
    } catch (err) {
      summary.errores++;
      const msg =
        err instanceof AnalyzeError
          ? `${err.status} ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      summary.detalles.push(`error: ${f.name} :: ${msg}`);
      if (err instanceof AnalyzeError) {
        advance(created); // problema del contenido/modelo: no reintentar en bucle
      } else {
        break; // transitorio: reintentar sin avanzar el cursor
      }
    }
  }

  if (cursor.getTime() > account.ingestSince.getTime()) {
    await prisma.googleAccount.update({
      where: { email: account.email },
      data: { ingestSince: cursor },
    });
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
