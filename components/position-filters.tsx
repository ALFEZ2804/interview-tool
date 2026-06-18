import Link from "next/link";

export interface PositionFilter {
  id: string;
  name: string;
  count: number;
}

export function PositionFilters({
  positions,
  activeId,
  q,
}: {
  positions: PositionFilter[];
  activeId?: string;
  q?: string;
}) {
  if (positions.length === 0) return null;

  // Conserva la búsqueda de texto al cambiar de posición.
  const withQ = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="-mx-1 flex flex-wrap gap-2">
      <Chip href={withQ({})} active={!activeId} label="Todas" />
      {positions.map((p) => (
        <Chip
          key={p.id}
          href={withQ({ position: p.id })}
          active={activeId === p.id}
          label={p.name}
          count={p.count}
        />
      ))}
    </div>
  );
}

function Chip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
      }`}
    >
      <span className="truncate max-w-[14rem]">{label}</span>
      {typeof count === "number" && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            active
              ? "bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
              : "bg-[color:var(--surface-2)] text-[color:var(--muted-2)]"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
