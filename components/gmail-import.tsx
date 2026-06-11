"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Interview } from "@/lib/types";
import type { GmailTranscript } from "@/app/api/gmail/transcripts/route";

type GmailState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "ready"; email: string; transcripts: GmailTranscript[] }
  | { kind: "analyzing"; subject: string }
  | { kind: "error"; message: string };

function formatDate(raw: string) {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

export function GmailImport() {
  const router = useRouter();
  const [state, setState] = useState<GmailState>({ kind: "loading" });

  useEffect(() => {
    fetch("/api/gmail/transcripts")
      .then(async (res) => {
        if (res.status === 401) {
          setState({ kind: "unauthenticated" });
          return;
        }
        const data = await res.json();
        if (data.error) {
          setState({ kind: "unauthenticated" });
          return;
        }
        setState({
          kind: "ready",
          email: data.email ?? "",
          transcripts: data.transcripts ?? [],
        });
      })
      .catch(() => setState({ kind: "unauthenticated" }));
  }, []);

  async function analyze(transcript: GmailTranscript) {
    setState({ kind: "analyzing", subject: transcript.subject });

    try {
      const res = await fetch("/api/gmail/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: transcript.id }),
      });

      const data = (await res.json()) as
        | { interview: Interview }
        | { error: string; details?: string };

      if (!res.ok || !("interview" in data)) {
        setState({
          kind: "error",
          message:
            "error" in data
              ? `${data.error}${data.details ? ` (${data.details})` : ""}`
              : `Error ${res.status}`,
        });
        return;
      }

      const { interview } = data;
      try {
        localStorage.setItem(
          `interview:${interview.id}`,
          JSON.stringify(interview)
        );
      } catch {
        // localStorage puede fallar en modo privado
      }

      router.push(`/interview/${interview.id}`);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  async function disconnect() {
    await fetch("/api/auth/google/logout", { method: "POST" });
    setState({ kind: "unauthenticated" });
  }

  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
        Comprobando Gmail…
      </div>
    );
  }

  if (state.kind === "unauthenticated") {
    return (
      <a
        href="/api/auth/google"
        className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-2)] transition"
      >
        <GoogleIcon />
        Conectar Gmail
      </a>
    );
  }

  if (state.kind === "analyzing") {
    return (
      <div className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin text-[color:var(--accent)]" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          Analizando transcript…
        </div>
        <p className="text-xs text-[color:var(--muted)] truncate">"{state.subject}"</p>
        <p className="text-xs text-[color:var(--muted-2)]">Esto suele tardar entre 10 y 30 segundos.</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <div className="font-medium mb-1">No se pudo analizar el transcript</div>
          <div className="text-red-200/80 text-xs leading-relaxed">{state.message}</div>
        </div>
        <button
          onClick={() => setState({ kind: "loading" })}
          className="text-xs text-[color:var(--accent)] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ready
  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]">
        <div className="flex items-center gap-2">
          <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs text-[color:var(--muted)] truncate">{state.email}</span>
        </div>
        <button
          onClick={disconnect}
          className="text-[11px] text-[color:var(--muted-2)] hover:text-[color:var(--muted)] transition"
        >
          Desconectar
        </button>
      </div>

      {state.transcripts.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[color:var(--muted)]">No se encontraron transcripts de Google Meet.</p>
          <p className="text-xs text-[color:var(--muted-2)] mt-1">
            Asegúrate de que Gemini está activado en tus reuniones de Google Meet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--border)]">
          {state.transcripts.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => analyze(t)}
                className="group w-full text-left px-4 py-3 hover:bg-[color:var(--surface-2)] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-[color:var(--accent)] transition">
                      {t.subject}
                    </p>
                    {t.snippet && (
                      <p className="text-xs text-[color:var(--muted)] mt-0.5 line-clamp-1">
                        {t.snippet}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-[color:var(--muted-2)] mt-0.5">
                    {formatDate(t.date)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
