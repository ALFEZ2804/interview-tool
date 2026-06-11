import type { RolePresentation as Role } from "@/lib/types";

const focusBadge = {
  technical: { label: "Foco técnico", className: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
  business: { label: "Foco business", className: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30" },
  mixed: { label: "Foco mixto", className: "bg-[color:var(--accent-soft)] text-[color:var(--accent)] border-[color:var(--accent-border)]" },
};

export function RolePresentation({ role }: { role: Role }) {
  const badge = focusBadge[role.focus];

  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
      <header className="px-5 py-4 border-b border-[color:var(--border)] flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
            Presentación de la posición
          </div>
          <h2 className="text-lg font-semibold mt-1">{role.title}</h2>
          <div className="text-xs text-[color:var(--muted)] mt-1">
            {role.seniority} · {role.team} · {role.location}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${badge.className}`}>
          {badge.label}
        </span>
      </header>
      <div className="px-5 py-4 space-y-5">
        <p className="text-sm leading-relaxed text-[color:var(--foreground)]/90">
          {role.summary}
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          <RoleBlock title="Responsabilidades" items={role.responsibilities} />
          <RoleBlock title="Requisitos" items={role.requirements} />
          <RoleBlock title="Nice to have" items={role.niceToHave} muted />
        </div>
      </div>
    </section>
  );
}

function RoleBlock({
  title,
  items,
  muted = false,
}: {
  title: string;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)] mb-2">
        {title}
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex gap-2 ${muted ? "text-[color:var(--muted)]" : ""}`}
          >
            <span className="text-[color:var(--accent)] shrink-0 mt-1.5">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
