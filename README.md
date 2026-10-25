# Nova Interview Tool

A web application for reviewing technical interviews. Upload a transcript and the system uses an OpenAI model to produce a structured interview review, including role context, feedback on the interviewer’s pitch and questions, follow-up suggestions, and a candidate scorecard.

The application also supports Google sign-in and an optional Google Drive ingestion workflow for Gemini interview notes. The interface is currently in Spanish.

## What it does

- Accepts PDF, TXT, and VTT interview transcripts.
- Extracts text from PDFs and generates a validated analysis with the OpenAI SDK.
- Stores interviews and positions in PostgreSQL.
- Provides search and filters for role and seniority.
- Includes a fictional preloaded interview example.
- Supports an optional Google Apps Script integration that imports Gemini notes from Drive.

## Important access and data notes

The application requires Google OAuth to access its pages, including the sample interview. The OAuth flow requests read-only Google Drive access for the optional ingestion workflow. Configure a test Google OAuth app and use a test account; do not connect an account containing real candidate documents just to try the portfolio project.

The sample interview is fictional. Use only synthetic transcripts when testing uploads. Interview transcripts and assessments can contain sensitive employment information.

## Requirements

- Node.js 20.9 or newer
- PostgreSQL
- An OpenAI API key for transcript analysis
- A Google OAuth client for sign-in

## Local setup

1. Copy the environment template before installing dependencies:

~~~powershell
Copy-Item .env.example .env
~~~

On macOS or Linux:

~~~sh
cp .env.example .env
~~~

2. Create a PostgreSQL database and set DATABASE_URL in .env.

   Alternatively, use the included Compose file to run only PostgreSQL locally:

   ~~~sh
   docker compose up -d db
   ~~~

   For that local database, set `DATABASE_URL=postgresql://nova:nova@localhost:5432/nova_interviews` in `.env`. Stop it with `docker compose down`; add `-v` only if you also want to delete its persisted database volume.

3. Configure a Google OAuth client in Google Cloud:
   - Add http://localhost:3000/api/oauth/google/callback as an authorized redirect URI.
   - Add your own Google account as a test user.
   - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.
   - Set ALLOWED_EMAIL_DOMAIN to a domain you control. For a local test only, it can be left blank if Google OAuth is restricted to your test users.

4. Configure the remaining values in .env:
   - OPENAI_API_KEY: required to analyze a transcript.
   - AUTH_SECRET: session-signing secret; generate with openssl rand -hex 32.
   - TOKEN_ENC_KEY: 32-byte hexadecimal key for encrypting Google refresh tokens; generate with openssl rand -hex 32.
   - ADMIN_EMAILS: optional comma-separated list of local admin accounts.
   - INGEST_SECRET: only needed for the optional automated ingestion endpoint.

5. Install dependencies, apply the database migrations, and start the app:

~~~sh
npm ci
npx prisma migrate deploy
npm run dev
~~~

Open http://localhost:3000 and sign in with the configured Google test account. After sign-in, open **Nueva entrevista** and use the preloaded example to inspect a sample analysis without uploading a transcript. See [DEMO.md](DEMO.md) for a short review walkthrough and the exact access requirements.

## Optional: Google Drive ingestion

The repository includes an Apps Script integration in automation/. It imports Gemini interview notes from Drive into the application. Follow [automation/README.md](automation/README.md) only if you want to configure that workflow; it is not required for the manual upload flow.

## Quality checks

~~~sh
npm run lint
npm run build
~~~

There is no dedicated automated test script in package.json.

## Configuration reference

See .env.example for all options, including model choice, access window, backfill window, and admin access. Keep .env and all OAuth/API credentials private. OpenAI and Google API usage is subject to the credentials and provider settings you configure.

