"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ManagedPosition = {
  id: string;
  name: string;
  interviewCount: number;
};

type Feedback = { kind: "error" | "ok"; message: string } | null;

export function PositionManager({
  positions,
}: {
  positions: ManagedPosition[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [merging, setMerging] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Estado de renombrado (un puesto a la vez).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const byId = useMemo(
    () => new Map(positions.map((p) => [p.id, p])),
    [positions]
  );

  function toggleSelect(id: string) {
    setFeedback(null);
    setConfirming(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // El destino debe ser uno de los seleccionados: si deja de estarlo, se
      // recoloca en el seleccionado con más entrevistas (el "principal").
      const ids = Array.from(next);
      if (!next.has(targetId)) {
        const best = ids
          .map((x) => byId.get(x))
          .filter((p): p is ManagedPosition => !!p)
          .sort((a, b) => b.interviewCount - a.interviewCount)[0];
        setTargetId(best?.id ?? "");
      }
      return next;
    });
  }

  const selectedList = Array.from(selected)
    .map((id) => byId.get(id))
    .filter((p): p is ManagedPosition => !!p);
  const canMerge = selected.size >= 2 && selected.has(targetId);
  const target = byId.get(targetId);
  const movedCount = selectedList
    .filter((p) => p.id !== targetId)
    .reduce((acc, p) => acc + p.interviewCount, 0);

  async function doMerge() {
    if (!canMerge) return;
    setMerging(true);
    setFeedback(null);
    try {
      const sourceIds = selectedList
        .filter((p) => p.id !== targetId)
        .map((p) => p.id);
      const res = await fetch("/api/positions/merge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId, sourceIds }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        movedInterviews?: number;
        deletedPositions?: number;
      } | null;
      if (!res.ok) {
        throw new Error(data?.error || "No se pudieron fusionar los puestos.");
      }
      setSelected(new Set());
      setTargetId("");
      setConfirming(false);
      setFeedback({
        kind: "ok",
        message: `Fusión completada: ${data?.movedInterviews ?? 0} entrevistas movidas, ${data?.deletedPositions ?? 0} puestos eliminados.`,
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Error desconocido.",
      });
    } finally {
      setMerging(false);
    }
  }

  function startRename(p: ManagedPosition) {
    setFeedback(null);
    setEditingId(p.id);
    setEditName(p.name);
  }

  async function saveRename() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setRenaming(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/positions/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo renombrar el puesto.");
      }
      setEditingId(null);
      setEditName("");
      router.refresh();
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Error desconocido.",
      });
    } finally {
      setRenaming(false);
    }
  }

  if (positions.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)]">
        No hay puestos todavía.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[color:var(--muted)]">
        Marca los puestos que sean el mismo rol, elige cuál conservar y fusiónalos:
        sus entrevistas se mueven al puesto elegido y los demás se eliminan.
      </p>

      <div className="overflow-x-auto rounded-lg border border-[color:var(--border)]">
        <table className="w-full text-sm">
          <thead className="text-left text-[color:var(--muted-2)]">
            <tr className="border-b border-[color:var(--border)]">
              <th className="px-4 py-2 font-medium w-10"></th>
              <th className="px-4 py-2 font-medium">Puesto</th>
              <th className="px-4 py-2 font-medium w-28">Entrevistas</th>
              <th className="px-4 py-2 font-medium w-40 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const isSelected = selected.has(p.id);
              const isTarget = canMerge && targetId === p.id;
              return (
                <tr
                  key={p.id}
                  className="border-b border-[color:var(--border)] last:border-0"
                >
                  <td className="px-4 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Seleccionar ${p.name}`}
                      className="h-4 w-4 accent-[color:var(--accent)]"
                    />
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {editingId === p.id ? (
                      <span className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          autoFocus
                          disabled={renaming}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--background)] px-2 py-1 text-sm text-[color:var(--foreground)] focus:border-[color:var(--accent)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={saveRename}
                          disabled={renaming || !editName.trim()}
                          className="rounded-md bg-[color:var(--accent)] px-2 py-1 text-xs font-medium text-black transition hover:bg-[color:var(--accent-hover)] disabled:opacity-60"
                        >
                          {renaming ? "Guardando…" : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={renaming}
                          className="text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                        >
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-[color:var(--foreground)]">
                          {p.name}
                        </span>
                        {isTarget && (
                          <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--accent)]">
                            destino
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle text-[color:var(--muted)]">
                    {p.interviewCount}
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    {editingId === p.id ? null : (
                      <button
                        type="button"
                        onClick={() => startRename(p)}
                        className="text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
                      >
                        Renombrar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {feedback && (
        <p
          className={`rounded-md border px-4 py-2 text-sm ${
            feedback.kind === "ok"
              ? "border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
              : "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 text-[color:var(--danger)]"
          }`}
        >
          {feedback.message}
        </p>
      )}

      {selected.size > 0 && (
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 space-y-3">
          {selected.size < 2 ? (
            <p className="text-sm text-[color:var(--muted)]">
              Selecciona al menos dos puestos para fusionarlos.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm text-[color:var(--foreground)]">
                  Conservar como puesto final:
                </label>
                <select
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    setConfirming(false);
                  }}
                  className="rounded-md border border-[color:var(--border-strong)] bg-[color:var(--background)] px-3 py-1.5 text-sm text-[color:var(--foreground)] focus:border-[color:var(--accent)] focus:outline-none"
                >
                  {selectedList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {confirming ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[color:var(--muted)]">
                    Se moverán{" "}
                    <span className="font-medium text-[color:var(--foreground)]">
                      {movedCount}
                    </span>{" "}
                    entrevistas a «{target?.name}» y se eliminarán{" "}
                    <span className="font-medium text-[color:var(--foreground)]">
                      {selected.size - 1}
                    </span>{" "}
                    puestos. ¿Confirmas?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={merging}
                      className="rounded-md border border-[color:var(--border)] px-3 py-1.5 text-sm font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)] disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={doMerge}
                      disabled={merging}
                      className="rounded-md bg-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-black transition hover:bg-[color:var(--accent-hover)] disabled:opacity-60"
                    >
                      {merging ? "Fusionando…" : "Confirmar fusión"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={!canMerge}
                  className="rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-black transition hover:bg-[color:var(--accent-hover)] disabled:opacity-60"
                >
                  Fusionar {selected.size} puestos
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
