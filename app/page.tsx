import { getPositionsWithInterviews } from "@/lib/queries";
import { UploadForm } from "@/components/upload-form";
import { SyncButton } from "@/components/sync-button";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  let positions: { id: string; name: string }[] = [];
  try {
    positions = (await getPositionsWithInterviews(session)).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  } catch {
    // Sin BD el formulario sigue funcionando en modo "nueva posición";
    // el error de conexión saltará al guardar, con un mensaje claro.
  }

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
          Sube el transcript de tu entrevista y el agente te dirá cómo
          presentaste el rol, qué tal funcionaron tus preguntas y qué deberías
          probar en la próxima ronda.
        </p>
      </section>

      <section className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Importar desde Google Drive</h2>
          <p className="text-xs text-[color:var(--muted)] leading-relaxed">
            Trae tus notas de Gemini de los últimos 90 días. Detecta los Google
            Docs cuyo nombre siga el formato{" "}
            <span className="font-mono text-[color:var(--foreground)]">
              Entrevista - Posición - Candidato
            </span>
            . La importación automática se ejecuta periódicamente; este botón la
            lanza al momento solo para tu cuenta.
          </p>
        </div>
        <SyncButton />
      </section>

      <UploadForm positions={positions} />
    </div>
  );
}
