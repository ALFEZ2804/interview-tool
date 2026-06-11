interface RatingStarsProps {
  value: number;
  outOf?: number;
  size?: "sm" | "md";
}

export function RatingStars({ value, outOf = 5, size = "sm" }: RatingStarsProps) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: outOf }).map((_, i) => (
        <Star key={i} filled={i < value} className={dim} />
      ))}
    </div>
  );
}

function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "var(--accent)" : "transparent"}
      stroke={filled ? "var(--accent)" : "var(--border-strong)"}
      strokeWidth={1.5}
      className={className}
      aria-hidden
    >
      <path d="M10 1.5l2.61 5.29 5.84.85-4.23 4.12 1 5.82L10 14.83 4.78 17.58l1-5.82L1.55 7.64l5.84-.85L10 1.5z" />
    </svg>
  );
}
