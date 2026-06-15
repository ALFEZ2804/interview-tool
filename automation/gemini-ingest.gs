/**
 * Ingesta automática de transcripciones de Gemini → interview-tool.
 *
 * Flujo: un filtro de Gmail etiqueta los correos "Notes by Gemini" de
 * entrevistas como LABEL_PENDING. Este script (trigger temporal) los procesa:
 * abre el Google Doc enlazado, extrae el texto, parsea la posición del asunto
 * y hace POST a /api/ingest. Al terminar, mueve el correo a LABEL_DONE.
 *
 * Setup: rellena CONFIG, ejecuta setup() una vez (crea etiquetas + trigger y
 * dispara la autorización de permisos de Gmail y Docs).
 */

var CONFIG = {
  INGEST_URL: "https://interview-tool-sigma.vercel.app/api/ingest",
  INGEST_SECRET: "PEGA_AQUI_EL_MISMO_SECRETO_QUE_EN_VERCEL",
  LABEL_PENDING: "Entrevistas/Pendiente",
  LABEL_DONE: "Entrevistas/Procesada",
  TRIGGER_MINUTES: 15,
};

/** Ejecuta una vez a mano: crea etiquetas, el trigger y pide autorización. */
function setup() {
  getOrCreateLabel_(CONFIG.LABEL_PENDING);
  getOrCreateLabel_(CONFIG.LABEL_DONE);

  // Evita duplicar el trigger si ya existe.
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === "processInterviews";
  });
  if (!exists) {
    ScriptApp.newTrigger("processInterviews")
      .timeBased()
      .everyMinutes(CONFIG.TRIGGER_MINUTES)
      .create();
  }
  Logger.log("Setup completo. Etiquetas y trigger listos.");
}

/** Punto de entrada del trigger. */
function processInterviews() {
  var pending = GmailApp.getUserLabelByName(CONFIG.LABEL_PENDING);
  var done = GmailApp.getUserLabelByName(CONFIG.LABEL_DONE);
  if (!pending || !done) {
    Logger.log("Faltan etiquetas. Ejecuta setup() primero.");
    return;
  }

  var threads = pending.getThreads();
  Logger.log("Hilos pendientes: " + threads.length);

  threads.forEach(function (thread) {
    var subject = thread.getFirstMessageSubject();
    try {
      var docId = findDocId_(thread);
      if (!docId) {
        Logger.log("Sin enlace a Doc, lo salto: " + subject);
        return;
      }

      var parsed = parseSubject_(subject);
      if (!parsed) {
        Logger.log("El asunto no encaja con la convención, lo salto: " + subject);
        return;
      }

      var transcript = DocumentApp.openById(docId).getBody().getText();

      var resp = UrlFetchApp.fetch(CONFIG.INGEST_URL, {
        method: "post",
        contentType: "application/json",
        headers: { "x-ingest-secret": CONFIG.INGEST_SECRET },
        payload: JSON.stringify({
          transcript: transcript,
          positionName: parsed.positionName,
        }),
        muteHttpExceptions: true,
      });

      var code = resp.getResponseCode();
      if (code === 200) {
        thread.removeLabel(pending).addLabel(done);
        Logger.log("OK [" + parsed.positionName + "] " + subject);
      } else {
        // Se deja en pendiente: se reintentará en la siguiente pasada.
        Logger.log("Fallo " + code + " :: " + resp.getContentText() + " :: " + subject);
      }
    } catch (err) {
      Logger.log("Error procesando '" + subject + "': " + err);
    }
  });
}

/** Saca el ID del Google Doc del cuerpo de cualquier mensaje del hilo. */
function findDocId_(thread) {
  var msgs = thread.getMessages();
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i].getBody().match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Parsea "Entrevista - <Posición> - <Candidato> - <fecha> - Notes by Gemini".
 * Devuelve { positionName, candidateName } o null si no encaja.
 */
function parseSubject_(subject) {
  if (!subject) return null;
  // Corta a partir del sufijo de Gemini (" - 2026/06/11 ...").
  var head = subject.split(/\s[-–]\s\d{4}\//)[0];
  var parts = head.split(/\s[-–]\s/).map(function (s) {
    return s.trim();
  });
  // parts[0] = "Entrevista", [1] = posición, [2] = candidato (opcional).
  if (parts.length < 2 || !parts[1]) return null;
  return { positionName: parts[1], candidateName: parts[2] || "" };
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}
