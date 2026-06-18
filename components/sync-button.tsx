"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  procesados: number;
  saltados: number;
  errores: number;
};

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function run() {
    setLoading(true);
    setMsg(null);
    setIsError(false);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = (await res.json()) as Summary & { error?: string };
      if (!res.ok) throw new Error(data?.error || "No se pudo sincronizar.");

      const { procesados, errores } = data;
      if (procesados > 0) {
        const plural = procesados === 1 ? "" : "s";
        setMsg(`${procesados} entrevista${plural} nueva${plural} importada${plural}.`);
        router.refresh(); // recarga la lista sin recargar la página
      } else {
        setMsg("Sin entrevistas nuevas en tus notas de Gemini recientes.");
      }
      if (errores > 0) {
        setIsError(true);
        setMsg((m) => `${m ?? ""} (${errores} con error)`.trim());
      }
    } catch (e) {
      setIsError(true);
      setMsg(e instanceof Error ? e.message : "No se pudo sincronizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        title="Trae tus notas de Gemini de Google Drive de los últimos 90 días"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)] disabled:opacity-60"
      >
        <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sincronizando…" : "Sincronizar entrevistas"}
      </button>
      {msg && (
        <p
          className={`px-3 text-[11px] leading-relaxed ${
            isError ? "text-[color:var(--danger)]" : "text-[color:var(--muted-2)]"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

function RefreshIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
