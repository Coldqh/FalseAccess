interface GameLogoProps {
  compact?: boolean;
  className?: string;
}

export function GameLogo({ compact = false, className = '' }: GameLogoProps) {
  return (
    <svg
      className={`game-logo ${compact ? 'compact' : ''} ${className}`.trim()}
      viewBox="0 0 160 160"
      role="img"
      aria-label="FALSE ACCESS"
    >
      <defs>
        <linearGradient id="fa-shell" x1="18" y1="10" x2="144" y2="152" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1c2026" />
          <stop offset="1" stopColor="#08090b" />
        </linearGradient>
        <linearGradient id="fa-cut" x1="28" y1="31" x2="132" y2="129" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffdf3" />
          <stop offset="1" stopColor="#bfc4c8" />
        </linearGradient>
        <filter id="fa-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect x="4" y="4" width="152" height="152" rx="35" fill="url(#fa-shell)" />
      <rect x="4.75" y="4.75" width="150.5" height="150.5" rx="34.25" fill="none" stroke="#ffffff" strokeOpacity=".12" strokeWidth="1.5" />
      <path d="M27 35h83l-14 21H50v20h37L74 97H50v28H27V35Z" fill="url(#fa-cut)" />
      <path d="M112 34h21v92h-21V34Z" fill="#ff5a38" opacity=".14" filter="url(#fa-glow)" />
      <path d="M112 34h21v92h-21V34Z" fill="#ff5a38" />
      <path d="M102 67h31v17h-31l10-17Z" fill="#08090b" />
      <path d="M90 111h43v15H80l10-15Z" fill="#08090b" />
      <circle cx="124" cy="43" r="3" fill="#08090b" />
      <path d="M20 142h120" stroke="#ff5a38" strokeOpacity=".42" />
    </svg>
  );
}
