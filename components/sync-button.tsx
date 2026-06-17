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
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium transition hover:bg-[color:var(--accent-soft)] disabled:opacity-60"
      >
        <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sincronizando…" : "Sincronizar mis entrevistas"}
      </button>
      {msg && (
        <span
          className={`text-xs ${
            isError ? "text-red-400" : "text-[color:var(--muted)]"
          }`}
        >
          {msg}
        </span>
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
