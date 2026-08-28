const hotspots = [
  { top: "12%", left: "18%", size: 240, intensity: 0.5 },
  { top: "6%", left: "44%", size: 180, intensity: 0.35 },
  { top: "34%", left: "62%", size: 150, intensity: 0.4 },
  { top: "52%", left: "26%", size: 260, intensity: 0.3 },
  { top: "58%", left: "70%", size: 200, intensity: 0.28 },
  { top: "26%", left: "8%", size: 160, intensity: 0.3 },
];

export function TacticalMap({ showHotspots }: { showHotspots: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-shell">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, white 4%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, white 4%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {showHotspots &&
        hotspots.map((h, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute rounded-full blur-3xl"
            style={{
              top: h.top,
              left: h.left,
              width: h.size,
              height: h.size,
              background: `radial-gradient(circle, color-mix(in oklab, oklch(0.6 0.14 235) ${Math.round(
                h.intensity * 100,
              )}%, transparent) 0%, transparent 70%)`,
            }}
          />
        ))}
    </div>
  );
}
