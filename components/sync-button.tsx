"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  procesados: number;
  saltados: number;
  errores: number;
  // El back para con gracia si agota su presupuesto de tiempo: quedan docs.
  incompleto?: boolean;
};

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function run() {
    setLoading(true);
    setIsError(false);
    setMsg("Sincronizando…");

    // El back procesa 1 entrevista por llamada para no acercarse al límite de 60s
    // de Vercel. Aquí encadenamos pasadas hasta vaciar la cola, mostrando el
    // progreso. El tope y la salvaguarda de "sin trabajo" evitan bucles infinitos.
    const MAX_PASADAS = 60;
    let totalProcesados = 0;
    let totalErrores = 0;
    let sinTrabajo = 0;

    try {
      for (let i = 0; i < MAX_PASADAS; i++) {
        const res = await fetch("/api/sync", { method: "POST" });

        // No asumimos que la respuesta sea JSON: si la plataforma corta la
        // función, Vercel responde un 504 en texto plano ("An error occurred…")
        // y un res.json() directo reventaría con "Unexpected token 'A'…".
        const raw = await res.text();
        let data: (Summary & { error?: string }) | null = null;
        try {
          data = raw ? (JSON.parse(raw) as Summary & { error?: string }) : null;
        } catch {
          data = null;
        }
        if (!res.ok || !data) {
          throw new Error(
            data?.error ||
              "La sincronización se interrumpió (la plataforma tardó demasiado). Vuelve a pulsar para continuar donde se quedó."
          );
        }

        totalProcesados += data.procesados;
        totalErrores += data.errores;
        if (data.procesados > 0) router.refresh(); // refleja las nuevas al momento

        // Si una pasada ni procesa ni salta nada pero dice que queda trabajo, algo
        // está atascado (p. ej. un Doc que falla al exportar). Cortamos tras un par.
        if (data.procesados === 0 && data.saltados === 0) {
          if (++sinTrabajo >= 2) break;
        } else {
          sinTrabajo = 0;
        }

        if (!data.incompleto) break;

        const plural = totalProcesados === 1 ? "" : "s";
        setMsg(
          `Sincronizando… ${totalProcesados} importada${plural}, hay más en cola.`
        );
      }

      const plural = totalProcesados === 1 ? "" : "s";
      if (totalProcesados > 0) {
        setMsg(`${totalProcesados} entrevista${plural} importada${plural}.`);
        router.refresh();
      } else {
        setMsg("Sin entrevistas nuevas en tus notas de Gemini recientes.");
      }
      if (totalErrores > 0) {
        setIsError(true);
        setMsg((m) => `${m ?? ""} (${totalErrores} con error)`.trim());
      }
    } catch (e) {
      setIsError(true);
      if (totalProcesados > 0) router.refresh();
      const base =
        totalProcesados > 0
          ? `${totalProcesados} importada${totalProcesados === 1 ? "" : "s"} antes de cortarse. `
          : "";
      setMsg(base + (e instanceof Error ? e.message : "No se pudo sincronizar."));
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
