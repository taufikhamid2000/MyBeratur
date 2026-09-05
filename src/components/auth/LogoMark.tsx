export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" fill="#1d4ed8" />
      <path
        d="M9 21.5v-11a1 1 0 0 1 1-1h5.2c2.8 0 4.6 1.5 4.6 3.9 0 1.6-.9 2.8-2.3 3.3l2.9 4.8h-3l-2.6-4.4h-2.2v4.4H9Zm2.6-6.6h2.4c1.3 0 2.1-.6 2.1-1.8 0-1.1-.8-1.8-2.1-1.8h-2.4v3.6Z"
        fill="#f1f5f9"
      />
    </svg>
  );
}
