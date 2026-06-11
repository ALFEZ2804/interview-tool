import type { TranscriptLine } from "@/lib/types";

export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <header className="px-5 py-4 border-b border-[color:var(--border)]">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
          Transcript
        </div>
        <h2 className="text-lg font-semibold mt-1">Lo que se dijo</h2>
      </header>
      <ol className="divide-y divide-[color:var(--border)] max-h-[420px] overflow-y-auto scrollbar-thin">
        {lines.map((line, i) => (
          <li key={i} className="px-5 py-3 flex gap-3 items-start">
            <span className="font-mono text-[10px] text-[color:var(--muted-2)] mt-1 w-16 shrink-0 tabular-nums">
              {line.timestamp}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[10px] uppercase tracking-wide mb-0.5 ${
                  line.speaker === "interviewer"
                    ? "text-[color:var(--accent)]"
                    : "text-[color:var(--muted)]"
                }`}
              >
                {line.speaker === "interviewer" ? "Tú" : "Candidato"}
              </div>
              <p className="text-sm leading-relaxed">{line.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
