# Optional Google Drive ingestion

This Apps Script workflow imports Gemini interview notes from Google Drive into the application, so transcripts do not need to be uploaded manually. It reads the Google Doc text directly; it does not use the PDF parser.

## Workflow

~~~text
Google Meet interview
  -> Gemini creates a Google Doc and sends a notification email
  -> a Gmail filter labels the email as Interviews/Pending
  -> Apps Script runs every 15 minutes, reads the Doc, and POSTs it to /api/ingest
  -> the application analyzes and stores the interview
  -> the email is moved to Interviews/Processed
~~~

## Meeting title convention

Name each interview meeting:

~~~text
Interview - <Position> - <Candidate>
~~~

For example: Interview - Backend Engineer - Alex Smith. The position is parsed from the title and created if it does not already exist.

## One-time setup

1. Configure INGEST_SECRET in the application environment and in the Apps Script project. Generate a random value with openssl rand -hex 32.
2. Create a Gmail filter for Gemini interview notifications whose subject contains Interview. Apply the label Interviews/Pending.
3. Open script.google.com and create a project.
4. Paste the contents of gemini-ingest.gs into the project.
5. Set CONFIG.INGEST_SECRET and, if needed, CONFIG.INGEST_URL in the script.
6. Run setup() once and grant the requested Gmail and Google Docs permissions. This creates the labels and the 15-minute trigger.

The optional cron endpoint can also be called periodically using the key configured for ingestion. See .env.example for its settings.

## Manual check

Label a test notification as Interviews/Pending, then run processInterviews() from the Apps Script editor. Check the execution logs and confirm that the interview appears in the application and the email moves to Interviews/Processed.

If the POST fails, the email remains pending and will be retried on the next trigger. Use synthetic interview material when testing.
