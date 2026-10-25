# Portfolio demo walkthrough

Nova is a technical-interview review application. Its included interview is fictional and intended for exploring the interface without uploading a transcript.

## Fastest way to review

The project does not currently have a hosted public demo. Running it locally requires Node.js, PostgreSQL, a Google OAuth test client, and an OpenAI API key to analyze new transcripts. Google sign-in is required to access the application, including the fictional sample.

1. Follow the local setup in [README.md](README.md). Start PostgreSQL with the optional Compose file if useful.
2. Configure Google OAuth for `http://localhost:3000/api/oauth/google/callback` and add your test account to the OAuth consent screen's test users.
3. Start the application and sign in with that test account.
4. Open **Nueva entrevista** and choose the preloaded example to inspect the fictional analysis without uploading or analyzing a transcript.
5. Review the role context, interviewer feedback, follow-up questions, and candidate scorecard. Try search and the position/seniority filters on the home page.
6. To inspect the AI workflow, upload only a synthetic PDF, TXT, or VTT transcript. That action calls the configured OpenAI model and may incur usage charges.

## Suggested review order

- **First:** inspect the preloaded example and scorecard; this needs no model call.
- **Then:** inspect the upload flow and validation; generating a new analysis needs an OpenAI key.
- **Finally:** review the optional Google Drive ingestion integration in [automation/README.md](automation/README.md). It is not needed for the core application demo.

## Privacy and access

Use a dedicated Google test account and fictional interview material. The optional Drive integration requests read-only Drive access. Do not connect an account with real candidate documents for a portfolio review. OAuth credentials, model keys, and session-encryption secrets belong in `.env`, never in the repository.

## What the demo demonstrates

- Transcript upload and PDF text extraction.
- Structured AI analysis validated against an application schema.
- Persistent interview records in PostgreSQL.
- Search, position and seniority filters, and scorecard views.
- Google OAuth and an optional, separately configured Drive ingestion workflow.
