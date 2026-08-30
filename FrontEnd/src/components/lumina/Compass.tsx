export function Compass() {
  return (
    <div className="glass-panel relative flex size-[88px] items-center justify-center rounded-full bg-surface-1/70">
      <span className="absolute top-1 font-mono text-label-sm text-muted-foreground">N</span>
      <span className="absolute bottom-1 font-mono text-label-sm text-muted-foreground">S</span>
      <span className="absolute left-2 font-mono text-label-sm text-muted-foreground">W</span>
      <span className="absolute right-2 font-mono text-label-sm text-muted-foreground">E</span>
      <span
        aria-hidden="true"
        className="absolute h-8 w-0.5 origin-bottom rounded-full bg-signal-brand"
        style={{ transform: "rotate(-45deg) translateY(-8px)" }}
      />
      <span className="font-mono text-label-md font-bold text-foreground">NW</span>
    </div>
  );
}
