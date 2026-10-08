function StarIcon({ filled, size }: { readonly filled: boolean; readonly size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.6l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.1l6.1-.9z" />
    </svg>
  );
}

export interface StarsProps {
  readonly value: number;
  readonly size?: number;
  readonly className?: string;
}

/** Visual-only 5-star rating. Data always comes from the product. */
export default function Stars({ value, size = 16, className }: StarsProps) {
  const rounded = Math.round(value);
  const label = `${value.toFixed(1)} من 5`;

  return (
    <span className={className ? `stars ${className}` : 'stars'} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rounded} size={size} />
      ))}
    </span>
  );
}
