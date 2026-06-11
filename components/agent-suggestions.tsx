"use client";

import { useState } from "react";
import type { AgentSuggestions } from "@/lib/types";

type Tab = "killer" | "technical" | "business";

const tabs: { id: Tab; label: string; hint: string }[] = [
  {
    id: "killer",
    label: "Killer",
    hint: "Preguntas filtro que separan senior real de senior nominal.",
  },
  {
    id: "technical",
    label: "Técnicas",
    hint: "Profundizan en arquitectura, decisiones y herramientas.",
  },
  {
    id: "business",
    label: "Business",
    hint: "Evalúan criterio de negocio, prioridades y comunicación ejecutiva.",
  },
];

export function AgentSuggestionsPanel({
  suggestions,
  roleTitle,
}: {
  suggestions: AgentSuggestions;
  roleTitle: string;
}) {
  const [active, setActive] = useState<Tab>("killer");
  const [open, setOpen] = useState(true);

  const items = suggestions[active];
  const activeTab = tabs.find((t) => t.id === active)!;

  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--accent-border)] bg-[color:var(--surface)] glow-accent overflow-hidden">
      <header className="px-5 py-4 border-b border-[color:var(--border)] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--accent)] text-black text-[11px] font-bold">
              AI
            </span>
            <div className="text-[11px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
              Agente Nova
            </div>
          </div>
          <h2 className="text-lg font-semibold mt-1">
            Sugerencias para tu próxima entrevista
          </h2>
          <p className="text-xs text-[color:var(--muted)] mt-1">
            Preguntas pensadas para un rol{" "}
            <span className="text-[color:var(--foreground)] font-medium">
              {roleTitle}
            </span>
            , basadas en cómo fue esta sesión.
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] transition"
        >
          {open ? "Plegar" : "Desplegar"}
        </button>
      </header>

      {open && (
        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                  active === t.id
                    ? "bg-[color:var(--accent)] text-black border-[color:var(--accent)]"
                    : "bg-[color:var(--background)]/40 text-[color:var(--muted)] border-[color:var(--border)] hover:text-[color:var(--foreground)] hover:border-[color:var(--border-strong)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-[color:var(--muted)] italic">
            {activeTab.hint}
          </p>

          <ul className="space-y-2.5">
            {items.map((q, i) => (
              <li
                key={i}
                className="group flex items-start gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--background)]/40 px-4 py-3 hover:border-[color:var(--accent-border)] transition"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent)] text-[10px] font-bold">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed flex-1">{q}</p>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-[10px] uppercase tracking-wide text-[color:var(--accent)] hover:underline transition"
                  title="Copiar al guion (mock)"
                >
                  Añadir
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-2 text-[11px] text-[color:var(--muted-2)] border-t border-[color:var(--border)]">
            <span>
              Sugerencias generadas a partir de la presentación del rol + tu
              guion de esta entrevista.
            </span>
            <button
              type="button"
              className="text-[color:var(--accent)] hover:underline"
            >
              Regenerar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
