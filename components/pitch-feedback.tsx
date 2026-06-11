import type { PitchFeedback } from "@/lib/types";
import { AgentReadingsBlock, FeedbackBlock } from "./question-feedback";

export function PitchFeedbackBlock({ pitch }: { pitch: PitchFeedback }) {
  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <header className="px-5 py-4 border-b border-[color:var(--border)]">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted-2)]">
          Feedback de tu pitch
        </div>
        <h2 className="text-lg font-semibold mt-1">
          Cómo presentaste la posición
        </h2>
        <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
          Antes de evaluar tus preguntas, el agente revisa cómo abriste la
          entrevista: claridad del rol, gancho, honestidad y tiempo invertido en
          contexto.
        </p>
      </header>
      <div className="px-5 py-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FeedbackBlock
            title="Lo que funcionó"
            items={pitch.strengths}
            tone="positive"
          />
          <FeedbackBlock
            title="A mejorar"
            items={pitch.improvements}
            tone="negative"
          />
        </div>
        <AgentReadingsBlock readings={pitch.agentReadings} />
      </div>
    </section>
  );
}
