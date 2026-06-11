"use client";

import { useState, type ReactNode } from "react";

type Tab = "feedback" | "suggestions";

const tabs: { id: Tab; label: string; description: string }[] = [
  {
    id: "feedback",
    label: "Feedback",
    description: "Cómo fue tu pitch y tus preguntas en esta entrevista.",
  },
  {
    id: "suggestions",
    label: "Sugerencias",
    description: "Preguntas que el agente te recomienda para la próxima ronda.",
  },
];

export function InterviewTabs({
  feedback,
  suggestions,
}: {
  feedback: ReactNode;
  suggestions: ReactNode;
}) {
  const [active, setActive] = useState<Tab>("feedback");
  const activeTab = tabs.find((t) => t.id === active)!;

  return (
    <div className="space-y-5">
      <div className="sticky top-14 z-20 -mx-6 px-6 py-3 bg-[color:var(--background)]/85 backdrop-blur border-b border-[color:var(--border)]">
        <div
          role="tablist"
          aria-label="Vista de la entrevista"
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === t.id
                  ? "bg-[color:var(--accent)] text-black"
                  : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-2">
          {activeTab.description}
        </p>
      </div>

      <div role="tabpanel">
        {active === "feedback" ? feedback : suggestions}
      </div>
    </div>
  );
}
