// Marca de Nova (símbolo oficial extraído de su logo) sobre el cuadrado teal,
// igual que su favicon (app/favicon.ico) y su webclip (app/apple-icon.jpg). Usa
// la variable de acento del tema —que ya es el teal de Nova (#0eb0a4)— para el
// fondo, y blanco para el símbolo.
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
      <g transform="translate(7.45 6.5) scale(0.16964)" fill="#fff">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M77.1001 43.1279C50.9362 47.5456 27.7543 63.0076 12.977 85.0961C7.32076 93.2795 2.94484 102.277 0 111.779C17.5714 35.9381 50.3729 0 50.3729 0C50.3729 0 63.2064 14.0594 77.1001 43.1279ZM80.8441 52.7587L81.4626 52.6814C89.6966 71.823 96.1587 91.679 100.768 112C100.768 112 79.3421 90.486 54.0065 85.262C51.6085 84.7762 49.1374 84.7762 46.7394 85.262C21.8787 90.3866 0.795188 111.172 0 111.967C8.92534 94.6077 21.9701 79.701 37.9923 68.552C45.8549 63.227 54.4688 59.1062 63.5488 56.326C68.0653 54.969 72.6708 53.9283 77.332 53.2115C77.6848 53.1649 78.0366 53.1153 78.3883 53.0658C79.2036 52.9508 80.0185 52.8359 80.8441 52.7587Z"
        />
      </g>
    </svg>
  );
}
