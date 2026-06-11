"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import type { Interview } from "@/lib/types";
import { GmailImport } from "@/components/gmail-import";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | { kind: "error"; message: string };

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleFile(file: File) {
    setState({ kind: "uploading", fileName: file.name });

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as
        | { interview: Interview }
        | { error: string; details?: string };

      if (!res.ok || !("interview" in data)) {
        const message =
          "error" in data
            ? `${data.error}${data.details ? ` (${data.details})` : ""}`
            : `Error ${res.status}`;
        setState({ kind: "error", message });
        return;
      }

      const { interview } = data;
      try {
        localStorage.setItem(
          `interview:${interview.id}`,
          JSON.stringify(interview)
        );
      } catch {
        // localStorage puede fallar en modo privado; seguimos.
      }

      router.push(`/interview/${interview.id}`);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  const uploading = state.kind === "uploading";
  const errorMsg = state.kind === "error" ? state.message : null;

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
          Nova · Interview Tool
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight gradient-text">
          Cada entrevista, un paso más afilado.
        </h1>
        <p className="max-w-2xl text-[color:var(--muted)] leading-relaxed">
          Sube el transcript de tu entrevista y el agente te dirá cómo
          presentaste el rol, qué tal funcionaron tus preguntas y qué deberías
          probar en la próxima ronda.
        </p>
      </section>

      <section>
        <label
          htmlFor="transcript-file"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`group flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border-2 border-dashed px-8 py-16 text-center transition ${
            uploading
              ? "border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] cursor-wait pointer-events-none"
              : isDragging
              ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] cursor-pointer"
              : "border-[color:var(--border-strong)] bg-[color:var(--surface)] hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-2)] cursor-pointer"
          }`}
        >
          <input
            ref={inputRef}
            id="transcript-file"
            type="file"
            accept=".txt,.vtt,.pdf,application/pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {uploading ? (
            <Spinner />
          ) : (
            <UploadIcon
              className={`h-10 w-10 transition ${
                isDragging
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--muted)] group-hover:text-[color:var(--accent)]"
              }`}
            />
          )}

          {state.kind === "uploading" ? (
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-[color:var(--foreground)]">
                Analizando “{state.fileName}”…
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                Esto suele tardar entre 10 y 30 segundos.
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-[color:var(--foreground)]">
                Arrastra un transcript aquí o haz click para seleccionar
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                Aceptamos archivos .txt, .vtt o .pdf
              </div>
            </div>
          )}
        </label>

        {errorMsg && (
          <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <div className="font-medium mb-1">No se pudo analizar el archivo</div>
            <div className="text-red-200/80 text-xs leading-relaxed">
              {errorMsg}
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-[color:var(--muted-2)] text-center">
          También puedes ver un{" "}
          <a
            href="/interview/senior-backend-engineer-andrea-li"
            className="text-[color:var(--accent)] hover:underline"
          >
            ejemplo precargado
          </a>{" "}
          sin subir nada.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[color:var(--border)]" />
          <span className="text-xs text-[color:var(--muted-2)]">o importa desde Gmail</span>
          <div className="h-px flex-1 bg-[color:var(--border)]" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Transcripts de Google Meet</p>
              <p className="text-xs text-[color:var(--muted)] mt-0.5">
                Gemini genera transcripts automáticamente al terminar la reunión.
              </p>
            </div>
          </div>
          <GmailImport />
        </div>
      </section>
    </div>
  );
}

function UploadIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 w-10 animate-spin text-[color:var(--accent)]"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
