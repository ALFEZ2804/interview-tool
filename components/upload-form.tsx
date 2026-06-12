"use client";

import { useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NEW_POSITION = "__new__";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | { kind: "error"; message: string };

export function UploadForm({
  positions,
}: {
  positions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  // Sin posiciones existentes, el único camino es crear una nueva.
  const [selected, setSelected] = useState<string>(
    positions.length === 0 ? NEW_POSITION : ""
  );
  const [newName, setNewName] = useState("");

  const positionReady =
    selected === NEW_POSITION ? newName.trim().length > 0 : selected !== "";

  async function handleFile(file: File) {
    if (!positionReady) {
      setState({
        kind: "error",
        message:
          selected === NEW_POSITION
            ? "Escribe el nombre de la nueva posición antes de subir el transcript."
            : "Selecciona la posición a la que pertenece esta entrevista.",
      });
      return;
    }

    setState({ kind: "uploading", fileName: file.name });

    try {
      const form = new FormData();
      form.append("file", file);
      if (selected === NEW_POSITION) {
        form.append("newPositionName", newName.trim());
      } else {
        form.append("positionId", selected);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      // Si el servidor cae a nivel plataforma (timeout, crash del runtime…)
      // devuelve una página HTML, no JSON. Parsear eso a ciegas escondía el
      // error real tras un críptico "Unexpected token '<'".
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      if (!isJson) {
        setState({
          kind: "error",
          message: `El servidor respondió con un error ${res.status} (${res.statusText}). Reintenta en un momento; si persiste, revisa los logs del despliegue.`,
        });
        return;
      }

      const data = (await res.json()) as
        | { interviewId: string; positionId: string }
        | { error: string; details?: string };

      if (!res.ok || !("interviewId" in data)) {
        const message =
          "error" in data
            ? `${data.error}${data.details ? ` (${data.details})` : ""}`
            : `Error ${res.status}`;
        setState({ kind: "error", message });
        return;
      }

      router.push(`/interview/${data.interviewId}`);
      // Re-renderiza los server components (sidebar incluido) con la BD al día.
      router.refresh();
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
    <section className="space-y-5">
      <div className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] mb-1">
            Paso 1
          </div>
          <label
            htmlFor="position-select"
            className="text-sm font-medium text-[color:var(--foreground)]"
          >
            ¿A qué posición pertenece la entrevista?
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            id="position-select"
            value={selected}
            disabled={uploading}
            onChange={(e) => {
              setSelected(e.target.value);
              if (state.kind === "error") setState({ kind: "idle" });
            }}
            className="flex-1 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="" disabled>
              Selecciona una posición…
            </option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={NEW_POSITION}>+ Nueva posición</option>
          </select>

          {selected === NEW_POSITION && (
            <input
              type="text"
              value={newName}
              disabled={uploading}
              onChange={(e) => {
                setNewName(e.target.value);
                if (state.kind === "error") setState({ kind: "idle" });
              }}
              placeholder="Nombre de la posición, ej. CPO"
              className="flex-1 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-2)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          )}
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] mb-2">
          Paso 2
        </div>
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
            id="transcript-file"
            type="file"
            accept=".txt,.vtt,.pdf,application/pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
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
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <div className="font-medium mb-1">No se pudo analizar el archivo</div>
          <div className="text-red-200/80 text-xs leading-relaxed">
            {errorMsg}
          </div>
        </div>
      )}

      <p className="text-[11px] text-[color:var(--muted-2)] text-center">
        También puedes ver un{" "}
        <Link
          href="/interview/senior-backend-engineer-andrea-li"
          className="text-[color:var(--accent)] hover:underline"
        >
          ejemplo precargado
        </Link>{" "}
        sin subir nada.
      </p>
    </section>
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
