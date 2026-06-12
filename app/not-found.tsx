import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-sm text-[color:var(--muted)] max-w-md mx-auto">
        Esta entrevista o posición no existe, o fue eliminada.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-[color:var(--accent)] text-black text-sm font-medium px-4 py-2 hover:bg-[color:var(--accent-hover)] transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
