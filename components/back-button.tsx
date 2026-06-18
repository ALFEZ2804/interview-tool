"use client";

import { useRouter } from "next/navigation";

// Botón "Volver" real: regresa a la página anterior del historial (home,
// listado de una posición, resultados de búsqueda, sidebar…), no a un destino
// fijo. Si se llegó por enlace directo o recarga —no hay historial dentro de la
// app— cae al `fallbackHref` para no dejar el botón muerto ni salir del sitio.
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  function onBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
    >
      <ArrowLeftIcon className="h-3.5 w-3.5" />
      Volver
    </button>
  );
}

function ArrowLeftIcon({ className = "" }: { className?: string }) {
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
      <path d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  );
}
