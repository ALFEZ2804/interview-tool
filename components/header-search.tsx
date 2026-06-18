"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function HeaderSearch() {
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
      router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    }, 350);
    return () => clearTimeout(t);
    // Solo debe dispararse al cambiar el valor tecleado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  }

  function clear() {
    setValue("");
    router.push("/");
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="relative hidden flex-1 sm:block sm:max-w-md"
    >
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-2)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar entrevista…"
        aria-label="Buscar entrevista por nombre o posición"
        className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] py-2 pl-9 pr-9 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted-2)] focus:border-[color:var(--accent-border)] focus:bg-[color:var(--surface-2)] focus:ring-2 focus:ring-[color:var(--accent-soft)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[color:var(--muted-2)] transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)]"
        >
          <CloseIcon className="h-3.5 w-3.5" />
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
