# Ingesta automática de transcripciones de Gemini

Automatiza que las entrevistas grabadas con Gemini en Google Meet entren solas
en la interview-tool, sin subir nada a mano. La posición se detecta desde el
título de la reunión.

## Cómo funciona

```
Reunión de Meet  →  Google Doc "Notes by Gemini" + correo de aviso
   →  Filtro de Gmail etiqueta el correo como "Entrevistas/Pendiente"
   →  Apps Script (cada 15 min): abre el Doc, extrae el texto,
      parsea la posición del asunto y hace POST a /api/ingest
   →  La app analiza el transcript y guarda la entrevista
   →  El correo pasa a "Entrevistas/Procesada" (no se reprocesa)
```

No usa el parser de PDF: lee el texto del Google Doc directamente.

## Convención de nombrado (importante)

Nombra cada reunión de Meet de una entrevista así:

```
Entrevista - <Posición> - <Candidato>
```

Ejemplo: `Entrevista - C&B - Juan Pérez`. Gemini le añade el sufijo de fecha y
"Notes by Gemini" automáticamente. De ahí salen:

- el prefijo `Entrevista`, que usa el filtro de Gmail para etiquetar;
- la `<Posición>`, que se asocia a la entrevista (se crea si no existía).

## Setup (una vez)

1. **Backend**: añade `INGEST_SECRET` en Vercel (Production) y en tu `.env`
   local. Genera uno con `openssl rand -hex 32`.

2. **Filtro de Gmail**: crea un filtro que case los correos de Gemini de
   entrevistas (remitente del aviso de Gemini + asunto contiene `Entrevista`) y
   aplique la etiqueta `Entrevistas/Pendiente`. Las etiquetas las crea `setup()`.

3. **Apps Script**:
   - Ve a https://script.google.com → Nuevo proyecto.
   - Pega el contenido de `gemini-ingest.gs`.
   - Rellena `CONFIG.INGEST_SECRET` con el mismo secreto que en Vercel
     (y `INGEST_URL` si cambia el dominio).
   - Ejecuta la función `setup()` una vez y autoriza los permisos que pida
     (Gmail y Documentos). Eso crea las etiquetas y el trigger de 15 min.

A partir de ahí, solo tienes que nombrar las reuniones con la convención.

## Probar

- Etiqueta a mano un correo de entrevista con `Entrevistas/Pendiente`.
- En el editor de Apps Script, ejecuta `processInterviews()` y mira los logs
  (Ver → Registros). Debe aparecer `OK [<posición>] <asunto>` y la entrevista
  en la app, con el correo movido a `Entrevistas/Procesada`.

## Notas

- Si el POST falla, el correo se queda en `Pendiente` y se reintenta en la
  siguiente pasada del trigger.
- El secreto evita que cualquiera pueda crear entrevistas llamando al endpoint.
- Si en vez de las "Notes by Gemini" prefieres el transcript verbatim, basta con
  apuntar a ese otro Doc; el resto del flujo es idéntico.
