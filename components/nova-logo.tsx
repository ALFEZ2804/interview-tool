// Marca de Nova, el mismo trazo que el favicon (app/icon.svg) para que el logo
// del header y el icono de la pestaña sean idénticos. Usa las variables de tema
// para adaptarse al color de acento y al fondo.
export function NovaMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <path d="M9 8h4v16H9z" fill="var(--background)" />
      <path d="M19 8h4v16h-4z" fill="var(--background)" />
      <path d="M9 8h4l10 16h-4z" fill="var(--background)" />
    </svg>
  );
}
