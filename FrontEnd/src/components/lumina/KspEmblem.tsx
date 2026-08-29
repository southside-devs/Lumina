export function KspEmblem({ className = "size-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Karnataka State Police Emblem"
    >
      {/* Ashoka Stambha lions atop */}
      <path d="M47 8h6v5h-6zM42 13h16v3H42zM44 16h12v4H44z" opacity="0.95" />
      {/* Central circular chakra shield */}
      <circle cx="50" cy="35" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="35" r="3.5" />
      {/* Chakra spokes */}
      <path
        d="M50 21v28M36 35h28M40 25l20 20M60 25L40 45"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Gandaberunda Double-Headed Mythical Bird Body & Wings */}
      <path
        d="M50 38c-4 3-10 7-16 6-6-1-12-6-16-12 1 7 4 14 10 19 6 5 12 7 22 7s16-2 22-7c6-5 9-12 10-19-4 6-10 11-16 12-6 1-12-3-16-6z"
        opacity="0.95"
      />
      {/* Left Bird Head */}
      <path d="M37 28c-3-2-8-1-10 2 2 1 4 0 5-1-1 3-3 5-6 6 3 2 7 1 11-7z" />
      {/* Right Bird Head */}
      <path d="M63 28c3-2 8-1 10 2-2 1-4 0-5-1 1 3 3 5 6 6-3 2-7 1-11-7z" />
      {/* Feathers and lower talons */}
      <path
        d="M34 56c-6 5-11 12-12 20 5-2 10-5 14-9-2 5-3 10-2 15 4-3 8-7 11-12-1 6 0 11 2 16 3-6 5-11 7-17 2 6 4 11 7 17 2-5 3-10 2-16 3 5 7 9 11 12 1-5 0-10-2-15 4 4 9 7 14 9-1-8-6-15-12-20-4 4-9 7-15 7s-11-3-15-7z"
      />
      {/* Base Ribbon Banner */}
      <path
        d="M18 84c10 3 21 5 32 5s22-2 32-5l4 6c-12 4-24 6-36 6s-24-2-36-6l4-6z"
        opacity="0.9"
      />
      <circle cx="50" cy="92" r="1.5" />
    </svg>
  );
}
