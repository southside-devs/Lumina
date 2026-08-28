function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center gap-2 text-xs text-foreground"
    >
      <span>{label}</span>
      <span
        className={`relative h-4 w-8 rounded-full transition-colors ${on ? "bg-signal-ok" : "bg-surface-3"}`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-foreground transition-all ${on ? "left-4" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

export type MapToolbarProps = {
  showHotspots: boolean;
  onToggleHotspots: () => void;
  showPatrols: boolean;
  onTogglePatrols: () => void;
};

export function MapToolbar({
  showHotspots,
  onToggleHotspots,
  showPatrols,
  onTogglePatrols,
}: MapToolbarProps) {
  const icons = ["format_list_bulleted", "add", "remove", "my_location", "fullscreen", "layers"];
  return (
    <div className="glass-panel flex flex-wrap items-center gap-4 bg-surface-1/80 px-4 py-2 backdrop-blur-xl">
      <Toggle label="Show Hotspots" on={showHotspots} onToggle={onToggleHotspots} />
      <Toggle label="Patrol Units" on={showPatrols} onToggle={onTogglePatrols} />
      <span className="h-5 w-px bg-hairline" />
      <div className="flex items-center gap-1">
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            aria-label={icon.replace(/_/g, " ")}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="material-symbols-outlined text-base">{icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
