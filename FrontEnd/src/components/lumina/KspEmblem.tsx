export function KspEmblem({ className = "size-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Karnataka State Police Coat of Arms Emblem"
    >
      {/* Top Ashoka Lions Emblem */}
      <g fill="currentColor">
        <path d="M57 6h6v5h-6zM52 11h16v3H52zM54 14h12v4H54z" />
        <circle cx="60" cy="19" r="2.5" />
        <path d="M50 18c1-3 3-5 5-6 1 2 3 3 5 3s4-1 5-3c2 1 4 3 5 6-2 1-5 2-10 2s-8-1-10-2z" />
        {/* Ashoka Base & Chakra */}
        <rect x="52" y="21" width="16" height="3" rx="1" />
      </g>

      {/* Central Circular Shield with Gandaberunda */}
      <circle cx="60" cy="48" r="18" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.08" />
      <circle cx="60" cy="48" r="14.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />

      {/* Central Gandaberunda (Two-Headed Bird) inside shield */}
      <g fill="currentColor">
        {/* Twin Bird Heads facing outward */}
        <path d="M53 38c-3-2-7-1-9 2 2 1 4 0 5-1-1 3-2 5-5 6 3 2 6 0 9-7z" />
        <path d="M67 38c3-2 7-1 9 2-2 1-4 0-5-1 1 3 2 5 5 6-3 2-6 0-9-7z" />
        {/* Bird Crown / Crest */}
        <path d="M58 35h4v3h-4z" />
        {/* Bird Body & Wings */}
        <path d="M60 41c-4 2-8 6-12 5-5-1-9-5-12-10 1 6 3 12 8 16 5 4 10 5 16 5s11-1 16-5c5-4 7-10 8-16-3 5-7 9-12 10-4 1-8-3-12-5z" />
        {/* Central Core */}
        <ellipse cx="60" cy="48" rx="4" ry="6" />
        {/* Spread Tail & Lower Feathers */}
        <path d="M52 53c-3 4-7 8-8 12 4-1 7-3 9-6-1 4-2 7-1 11 3-2 6-5 7-9 1 4 1 7 2 11-3-4-6-6-11-2 4 3 7 5 11 1 4 4 7 2 11-1-5 4-8 2-11 2 1-4 1-7 2-11 1 4 4 7 7 9 1-4 0-7-1-11 2 3 5 5 9 6-1-4-5-8-8-12-3 2-6 3-9 3s-6-1-9-3z" />
      </g>

      {/* Left Rearing Supporter (Mythical Lion / Sharabha) */}
      <path
        d="M36 32c-3-4-8-5-12-3 1 3 3 5 6 5-3 3-5 7-5 12 2-1 4-1 6-2-2 4-3 9-1 14 3-1 5-3 7-6-1 5 1 10 4 14 3-2 5-5 6-9-1 5 2 10 6 13l2-4c-3-3-5-7-5-12 3 2 6 3 9 3l-1-4c-4-1-7-3-9-6 3-1 6-2 8-5l-2-3c-3 2-6 3-9 3 0-3 1-6 3-9 2 1 4 2 6 2l-1-4c-3-1-6-2-8-3 1-3 3-6 6-8l-3-2c-3 3-5 7-6 11-1-3-1-7 0-10z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Right Rearing Supporter (Mythical Lion / Sharabha) */}
      <path
        d="M84 32c3-4 8-5 12-3-1 3-3 5-6 5 3 3 5 7 5 12-2-1-4-1-6-2 2 4 3 9 1 14-3-1-5-3-7-6 1 5-1 10-4 14-3-2-5-5-6-9 1 5-2 10-6 13l-2-4c3-3 5-7 5-12-3 2-6 3-9 3l1-4c4-1 7-3 9-6-3-1-6-2-8-5l2-3c3 2 6 3 9 3 0-3-1-6-3-9-2 1-4 2-6 2l1-4c3-1 6-2 8-3-1-3-3-6-6-8l3-2c3 3 5 7 6 11 1-3 1-7 0-10z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Bottom Semicircular Scroll Ribbon */}
      <g fill="currentColor">
        <path
          d="M20 92c12 4 26 6 40 6s28-2 40-6l5 8c-14 5-30 8-45 8s-31-3-45-8l5-8z"
          opacity="0.95"
        />
        {/* Ribbon Ends */}
        <path d="M16 94l-6 12 12-3-6-9zM104 94l6 12-12-3 6-9z" opacity="0.8" />
        {/* Central Inscription Accent Dots */}
        <circle cx="60" cy="98.5" r="2" />
        <circle cx="48" cy="97" r="1.5" />
        <circle cx="72" cy="97" r="1.5" />
      </g>
    </svg>
  );
}
