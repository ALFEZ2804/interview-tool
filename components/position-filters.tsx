"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface PositionFilter {
  id: string;
  name: string;
  count: number;
}

// Filtro de posición de la home como desplegable con búsqueda interna. Mantiene
// el comportamiento anterior (navega a /?position=ID conservando la búsqueda de
// texto), pero ocupa menos sitio cuando hay muchas posiciones.
export function PositionFilters({
  positions,
  activeId,
  q,
}: {
  positions: PositionFilter[];
  activeId?: string;
  q?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const active = positions.find((p) => p.id === activeId);
  const totalCount = useMemo(
    () => positions.reduce((sum, p) => sum + p.count, 0),
    [positions]
  );

  const term = search.trim().toLowerCase();
  const filtered = term
    ? positions.filter((p) => p.name.toLowerCase().includes(term))
    : positions;

  // Conserva la búsqueda de texto al cambiar de posición.
  function hrefFor(positionId?: string) {
    const sp = new URLSearchParams();
    if (positionId) sp.set("position", positionId);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/?${s}` : "/";
  }

  function choose(positionId?: string) {
    setOpen(false);
    setSearch("");
    router.push(hrefFor(positionId));
  }

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (positions.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
          activeId
            ? "border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
            : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)]"
        }`}
      >
        <FilterIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[14rem] truncate">
          {active ? active.name : "Todas las posiciones"}
        </span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            activeId
              ? "bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
              : "bg-[color:var(--surface-2)] text-[color:var(--muted-2)]"
          }`}
        >
          {active ? active.count : totalCount}
        </span>
        <ChevronIcon
          className={`h-3.5 w-3.5 shrink-0 text-[color:var(--muted-2)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl">
          <div className="border-b border-[color:var(--border)] p-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-2)]" />
              <input
                autoFocus
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar posición…"
                aria-label="Buscar posición"
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] py-1.5 pl-8 pr-2 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted-2)] focus:border-[color:var(--accent)] [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
            {!term && (
              <Option
                label="Todas las posiciones"
                count={totalCount}
                active={!activeId}
                onSelect={() => choose(undefined)}
              />
            )}
            {filtered.map((p) => (
              <Option
                key={p.id}
                label={p.name}
                count={p.count}
                active={activeId === p.id}
                onSelect={() => choose(p.id)}
              />
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-[color:var(--muted-2)]">
                Sin resultados para “{search.trim()}”.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function Option({
  label,
  count,
  active,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left text-sm transition ${
          active
            ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
            : "text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]"
        }`}
      >
        <span className="truncate">{label}</span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            active
              ? "bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
              : "bg-[color:var(--surface-2)] text-[color:var(--muted-2)]"
          }`}
        >
          {count}
        </span>
      </button>
    </li>
  );
}

function FilterIcon({ className = "" }: { className?: string }) {
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
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
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

function SearchIcon({ className = "" }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
