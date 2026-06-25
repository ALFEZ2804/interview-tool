import { prisma } from "@/lib/db";
import { driveClientForAccount } from "@/lib/google";
import { analyzeAndStore, AnalyzeError } from "@/lib/analyze";
import { looksLikeInterview, isInterviewTitle } from "@/lib/classify";

export type IngestSummary = {
  procesados: number;
  saltados: number;
  errores: number;
  detalles: string[];
  // true si paramos por presupuesto de tiempo y quedan documentos por procesar.
  // El cursor (ingestSince) queda guardado en lo ya resuelto, así que la
  // siguiente pasada (clic manual o cron) continúa donde lo dejamos.
  incompleto?: boolean;
};

type Account = { email: string; refreshToken: string; ingestSince: Date };

const PAGE_SIZE = 25;

// En Hobby, maxDuration es 60s y una sola llamada al modelo consume casi todo ese
// tiempo (medido: ~24s una entrevista de 12 preguntas, hasta ~50s las largas).
// Para garantizar que la función NUNCA hace timeout —y que por tanto el cursor
// siempre llega a guardarse— procesamos como mucho UNA entrevista por invocación
// y dejamos que el botón encadene las pasadas que hagan falta.
const MAX_ANALYSES_PER_RUN = 1;

// Red de seguridad por tiempo: si los documentos saltados (no-entrevista o ya
// procesados) consumieran demasiado, paramos sin empezar análisis nuevos.
const TIME_BUDGET_MS = 30_000;

async function ingestAccount(
  account: Account,
  summary: IngestSummary,
  deadline: number
) {
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
    pageSize: PAGE_SIZE,
    spaces: "drive",
  });

  const files = res.data.files || [];
  // Cursor incremental: avanzamos ingestSince hasta el último Doc resuelto para
  // no reprocesar (ni reclasificar) en cada pasada del cron.
  let cursor = account.ingestSince;
  const advance = (created: Date | null) => {
    if (created && created.getTime() > cursor.getTime()) cursor = created;
  };
  let analizados = 0; // análisis (llamadas al modelo) hechos en esta invocación

  for (const f of files) {
    // Cortamos antes de empezar un nuevo documento si ya no queda presupuesto:
    // el cursor está guardado hasta el último resuelto, así que no perdemos nada.
    if (Date.now() > deadline) {
      summary.incompleto = true;
      summary.detalles.push("parado por tiempo: quedan documentos por procesar");
      break;
    }
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

    // Antes de la (única y cara) llamada al modelo persistimos el avance por los
    // documentos saltados hasta aquí. Si el análisis llegara a agotar el tiempo
    // de la función, la siguiente pasada no re-escanea lo ya saltado: arranca en
    // esta entrevista y la completa (evita quedarse en bucle sin progresar).
    if (cursor.getTime() > account.ingestSince.getTime()) {
      await prisma.googleAccount.update({
        where: { email: account.email },
        data: { ingestSince: cursor },
      });
      account.ingestSince = cursor;
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
        summary.incompleto = true;
        break; // transitorio: reintentar sin avanzar el cursor
      }
    }

    // Tope por invocación: hecha 1 entrevista paramos y dejamos el resto para la
    // siguiente pasada (el botón encadena). Así no nos acercamos al límite de 60s.
    if (++analizados >= MAX_ANALYSES_PER_RUN) {
      summary.incompleto = true;
      break;
    }
  }

  // Recorrida toda la página y vino llena: probablemente hay más notas en Drive
  // de las que pedimos, así que dejamos señal para continuar en la próxima pasada.
  if (!summary.incompleto && files.length >= PAGE_SIZE) {
    summary.incompleto = true;
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
  const deadline = Date.now() + TIME_BUDGET_MS;

  for (const account of accounts) {
    if (Date.now() > deadline) {
      summary.incompleto = true;
      break;
    }
    try {
      await ingestAccount(account, summary, deadline);
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
