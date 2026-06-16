"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarPosition } from "@/lib/types";

export function SidebarNav({ positions }: { positions: SidebarPosition[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <nav className="space-y-4">
      <Link
        href="/"
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
          pathname === "/"
            ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
            : "text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
        }`}
      >
        <PlusIcon className="h-4 w-4" />
        Nueva entrevista
      </Link>

      <Link
        href="/connect"
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
          pathname === "/connect"
            ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
            : "text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
        }`}
      >
        <PlugIcon className="h-4 w-4" />
        Conectar Google
      </Link>

      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] font-semibold">
            Posiciones
          </span>
          <span className="text-[11px] text-[color:var(--muted-2)]">
            {positions.length}
          </span>
        </div>

        {positions.length === 0 ? (
          <p className="px-3 text-xs text-[color:var(--muted-2)] leading-relaxed">
            Aún no hay posiciones. Sube tu primera entrevista y crea una.
          </p>
        ) : (
          <ul className="space-y-1">
            {positions.map((p) => {
              const isCollapsed = collapsed.has(p.id);
              const positionActive = pathname === `/position/${p.id}`;
              return (
                <li key={p.id}>
                  <div
                    className={`flex items-center rounded-md transition ${
                      positionActive
                        ? "bg-[color:var(--accent-soft)]"
                        : "hover:bg-[color:var(--surface)]"
                    }`}
                  >
                    <Link
                      href={`/position/${p.id}`}
                      className={`flex-1 min-w-0 px-3 py-2 text-sm font-medium truncate transition ${
                        positionActive
                          ? "text-[color:var(--accent)]"
                          : "text-[color:var(--foreground)]"
                      }`}
                    >
                      {p.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-expanded={!isCollapsed}
                      aria-label={`${isCollapsed ? "Mostrar" : "Ocultar"} entrevistas de ${p.name}`}
                      className="shrink-0 p-2 text-[color:var(--muted-2)] hover:text-[color:var(--foreground)] transition"
                    >
                      <ChevronIcon
                        className={`h-3.5 w-3.5 transition-transform ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <ul className="mt-0.5 mb-1 ml-3 border-l border-[color:var(--border)] pl-2 space-y-0.5">
                      {p.interviews.length === 0 ? (
                        <li className="px-2 py-1 text-xs text-[color:var(--muted-2)]">
                          Sin entrevistas
                        </li>
                      ) : (
                        p.interviews.map((i) => {
                          const active = pathname === `/interview/${i.id}`;
                          return (
                            <li key={i.id}>
                              <Link
                                href={`/interview/${i.id}`}
                                className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs transition ${
                                  active
                                    ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
                                }`}
                              >
                                <span className="truncate">
                                  {i.candidateName}
                                </span>
                                <span className="shrink-0 text-[10px] text-[color:var(--muted-2)]">
                                  {formatShortDate(i.date)} · {i.overallRating}
                                  /5
                                </span>
                              </Link>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlugIcon({ className = "" }: { className?: string }) {
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
      <path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8zM12 16v6" />
    </svg>
  );
}
