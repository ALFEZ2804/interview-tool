import { interviews } from "@/lib/mock-data";
import { InterviewCard } from "@/components/interview-card";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
          Nova · Interview Tool
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight gradient-text">
          Cada entrevista, un paso más afilado.
        </h1>
        <p className="max-w-2xl text-[color:var(--muted)] leading-relaxed">
          Sube el transcript de tu entrevista, revisa cómo encajan tus preguntas
          con la posición y deja que el agente te sugiera{" "}
          <span className="text-[color:var(--foreground)]">killer questions</span>
          , preguntas <span className="text-[color:var(--foreground)]">técnicas</span> o de{" "}
          <span className="text-[color:var(--foreground)]">business</span> para
          la próxima ronda.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tus entrevistas recientes</h2>
            <p className="text-xs text-[color:var(--muted)] mt-1">
              {interviews.length} entrevistas analizadas · ordenadas por fecha
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-[color:var(--accent)] text-black text-sm font-medium px-4 py-2 hover:bg-[color:var(--accent-hover)] transition"
          >
            + Nueva entrevista
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      </section>
    </div>
  );
}
