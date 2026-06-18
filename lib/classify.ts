// Detección de entrevistas SIN enviar contenido a OpenAI. Dos niveles:
//
//  - Nivel 1 (isInterviewTitle): por el título de la reunión, contra la lista de
//    títulos que el equipo usa al agendar entrevistas. No lee contenido.
//  - Nivel 2 (looksLikeInterview): heurística LOCAL (en nuestro servidor, sin
//    API externa) por señales de lenguaje de una entrevista de selección.
//
// Solo lo que se confirma como entrevista llega luego a OpenAI para el análisis
// completo. El contenido de reuniones comerciales/estratégicas/internas se
// procesa como mucho aquí, en local, y nunca se envía a OpenAI.

// ---------------------------------------------------------------------------
// Nivel 1 — título de la reunión
// ---------------------------------------------------------------------------

// Títulos EXACTOS (normalizados) que el equipo usa para entrevistas. Match
// exacto a propósito: un "Let's talk roadmap" o "Post-interview debrief" NO
// debe colarse por el fast-path (iría a OpenAI sin pasar por el Nivel 2).
const INTERVIEW_TITLES = new Set([
  "entrevista",
  "interview",
  "headhunting interview",
  "headhunting interview nova",
  "lets talk",
]);

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/['’`´]/g, "") // apóstrofos (let's -> lets)
    .replace(/\([^)]*\)/g, " ") // parentéticos: (meets), (online)...
    .replace(/[^a-z0-9 ]+/g, " ") // resto de signos (!, ., …) -> espacio
    .replace(/\s+/g, " ")
    .trim();
}

export function isInterviewTitle(docName: string): boolean {
  // El Doc de Gemini se llama "<título de la reunión> - Notes by Gemini". Quito
  // ese sufijo (inglés o español) antes de comparar.
  const title = normalizeTitle(
    docName.replace(/\s*[-–—]\s*(notes by gemini|notas de gemini).*$/i, "")
  );
  return INTERVIEW_TITLES.has(title);
}

// ---------------------------------------------------------------------------
// Nivel 2 — heurística local por contenido (sin OpenAI)
// ---------------------------------------------------------------------------

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Señales de entrevista de selección (entrevistador evaluando a un candidato).
// Cada regex es un "concepto"; contamos cuántos conceptos distintos aparecen.
const INTERVIEW_CUES: RegExp[] = [
  /\b(anos|years) (de experiencia|of experience)\b/,
  /\b(tu experiencia|tu trayectoria|tu perfil|your experience|your background)\b/,
  /\b(cuentame|hablame|tell me)\b.{0,20}\b(sobre|de|about)\b/,
  /\b(por que (quieres|te interesa|te gustaria)|que te motiva|why (do|are) you|what motivates you)\b/,
  /\b(el puesto|la posicion|la vacante|este rol|esta posicion|the (role|position|opening))\b/,
  /\b(expectativas salariales|banda salarial|salario|remuneracion|salary (expectations|range)|compensation)\b/,
  /\b(disponibilidad|preaviso|incorporacion|notice period|start date|availability)\b/,
  /\b(por que (dejaste|saliste|te fuiste)|empresa actual|trabajo actual|why did you leave|current (company|role|job))\b/,
  /\b(fortalezas|debilidades|areas de mejora|puntos (fuertes|debiles)|strengths|weaknesses)\b/,
  /\b(preguntas? para (nosotros|mi)|any questions for (us|me)|do you have any questions)\b/,
  /\b(proceso de seleccion|siguientes? (fase|paso|pasos|ronda)|proximos pasos|hiring process|next (steps|round))\b/,
  /\b(candidat[oa]|perfil que buscamos)\b/,
];

// Señales en contra (comercial / interno / estratégico). Solo desempatan casos
// dudosos: pesan frente a las de entrevista, no descartan por sí solas.
const NON_INTERVIEW_CUES: RegExp[] = [
  /\b(propuesta comercial|presupuesto|cotizacion|pricing|tarifa|factura(cion)?)\b/,
  /\b(renovacion|caso de uso|demo (del )?producto|onboarding del cliente)\b/,
  /\b(daily|sprint|retro(spectiva)?|stand-?up|backlog)\b/,
  /\b(okr|kpi|roadmap)\b/,
  /\b(1:1|one on one|uno a uno|sync interno|kick-?off)\b/,
  /\b(consejo de administracion|junta directiva|presupuesto anual)\b/,
];

// Nº mínimo de conceptos de entrevista para considerarlo entrevista. Sube el
// umbral para ser más estricto (menos falsos positivos -> menos riesgo de que
// una comercial llegue a OpenAI), bájalo para captar más entrevistas.
const MIN_INTERVIEW_CUES = 3;

export function looksLikeInterview(text: string): boolean {
  // Acotamos el barrido por coste, pero generoso: las señales se reparten por
  // todo el transcript, no solo al principio.
  const sample = normalizeText(text).slice(0, 40000);
  if (sample.replace(/\s+/g, " ").trim().length < 100) return false; // vacío/corto

  let positives = 0;
  for (const re of INTERVIEW_CUES) if (re.test(sample)) positives++;
  if (positives < MIN_INTERVIEW_CUES) return false;

  let negatives = 0;
  for (const re of NON_INTERVIEW_CUES) if (re.test(sample)) negatives++;

  return positives > negatives;
}
