"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  const firstRender = useRef(true);

  // Refleja en el input los cambios de URL que vienen de fuera (navegación,
  // clic en una pill de posición que conserva la búsqueda, botón atrás). Se
  // ajusta en fase de render comparando con el valor previo —el patrón que
  // recomienda React— en lugar de un efecto con setState (renders en cascada).
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setValue(urlQ);
  }

  // Construye la URL conservando el resto de filtros (posición, nivel) que ya
  // estuvieran en la URL: solo toca el parámetro "q".
  function urlWithQuery(trimmed: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (trimmed) sp.set("q", trimmed);
    else sp.delete("q");
    const s = sp.toString();
    return s ? `/?${s}` : "/";
  }

  // Navegación debounced al teclear. El guard evita navegar de más: si lo
  // tecleado ya coincide con la URL, no se vuelve a navegar.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const trimmed = value.trim();
    if (trimmed === urlQ) return;
    const t = setTimeout(() => {
      router.push(urlWithQuery(trimmed));
    }, 350);
    return () => clearTimeout(t);
    // Solo debe dispararse al cambiar el valor tecleado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(urlWithQuery(value.trim()));
  }

  function clear() {
    setValue("");
    router.push(urlWithQuery(""));
  }

  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--muted-2)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar entrevista por nombre o posición…"
        aria-label="Buscar entrevista por nombre o posición"
        className="w-full rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] py-3 pl-12 pr-11 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted-2)] focus:border-[color:var(--accent-border)] focus:bg-[color:var(--surface-2)] focus:ring-2 focus:ring-[color:var(--accent-soft)] md:text-base [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[color:var(--muted-2)] transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)]"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </form>
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

function CloseIcon({ className = "" }: { className?: string }) {
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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
