"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SidebarInterview, SidebarPosition } from "@/lib/types";

export function SidebarNav({ positions }: { positions: SidebarPosition[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Entrevista pendiente de confirmar borrado (null = diálogo cerrado).
  const [pending, setPending] = useState<SidebarInterview | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Filtra por nombre de candidato y por nombre de posición. Si coincide la
  // posición, se muestran todas sus entrevistas; si coincide solo un candidato,
  // se conserva la posición pero recortada a las entrevistas que casan.
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return positions;
    return positions
      .map((p) => {
        if (p.name.toLowerCase().includes(q)) return p;
        return {
          ...p,
          interviews: p.interviews.filter((i) =>
            i.candidateName.toLowerCase().includes(q)
          ),
        };
      })
      .filter((p) => p.name.toLowerCase().includes(q) || p.interviews.length > 0);
  }, [positions, q]);

  function askDelete(interview: SidebarInterview) {
    setDeleteError(null);
    setPending(interview);
  }

  function closeDialog() {
    if (deletingId) return; // no cerrar mientras se está borrando
    setPending(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!pending) return;
    const { id } = pending;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "No se pudo eliminar la entrevista.");
      }
      setPending(null);
      // Si estabas viendo la que se borra, vuelve al inicio; si no, recarga la
      // lista del servidor sin recargar la página.
      if (pathname === `/interview/${id}`) {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "No se pudo eliminar la entrevista."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
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

      {positions.length > 0 && (
        <div className="relative px-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-2)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o posición"
            aria-label="Buscar entrevistas por nombre o posición"
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] py-2 pl-8 pr-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted-2)] focus:border-[color:var(--accent)]"
          />
        </div>
      )}

      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] font-semibold">
            Posiciones
          </span>
          <span className="text-[11px] text-[color:var(--muted-2)]">
            {filtered.length}
          </span>
        </div>

        {positions.length === 0 ? (
          <p className="px-3 text-xs text-[color:var(--muted-2)] leading-relaxed">
            Aún no hay posiciones. Sube tu primera entrevista y crea una.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 text-xs text-[color:var(--muted-2)] leading-relaxed">
            Sin resultados para “{query.trim()}”.
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((p) => {
              // Con búsqueda activa siempre se expanden para ver los resultados.
              const isCollapsed = q ? false : collapsed.has(p.id);
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
                          const isDeleting = deletingId === i.id;
                          return (
                            <li
                              key={i.id}
                              className={`group/item flex items-center rounded transition ${
                                active
                                  ? "bg-[color:var(--accent-soft)]"
                                  : "hover:bg-[color:var(--surface)]"
                              } ${isDeleting ? "opacity-50" : ""}`}
                            >
                              <Link
                                href={`/interview/${i.id}`}
                                className={`flex flex-1 min-w-0 items-center justify-between gap-2 px-2 py-1.5 text-xs transition ${
                                  active
                                    ? "text-[color:var(--accent)]"
                                    : "text-[color:var(--muted)] group-hover/item:text-[color:var(--foreground)]"
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
                              <button
                                type="button"
                                onClick={() => askDelete(i)}
                                disabled={isDeleting}
                                aria-label={`Eliminar entrevista de ${i.candidateName}`}
                                title="Eliminar entrevista"
                                className="shrink-0 p-1.5 text-[color:var(--muted-2)] opacity-0 transition hover:text-[color:var(--danger)] focus:opacity-100 group-hover/item:opacity-100 disabled:cursor-not-allowed"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
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

    <ConfirmDeleteDialog
      interview={pending}
      deleting={deletingId !== null}
      error={deleteError}
      onCancel={closeDialog}
      onConfirm={confirmDelete}
    />
    </>
  );
}

function ConfirmDeleteDialog({
  interview,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  interview: SidebarInterview | null;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Cerrar con Escape mientras el diálogo esté abierto.
  useEffect(() => {
    if (!interview) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [interview, onCancel]);

  if (!interview) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-sm rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--danger)]/10 text-[color:var(--danger)]">
            <TrashIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2
              id="delete-dialog-title"
              className="text-sm font-semibold text-[color:var(--foreground)]"
            >
              Eliminar entrevista
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
              ¿Seguro que quieres eliminar la entrevista de{" "}
              <span className="font-medium text-[color:var(--foreground)]">
                {interview.candidateName}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-xs text-[color:var(--danger)]">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-md border border-[color:var(--border)] px-3 py-1.5 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--danger)] px-3 py-1.5 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {deleting && <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />}
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
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

function SpinnerIcon({ className = "" }: { className?: string }) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
