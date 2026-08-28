type Tone = "neutral" | "critical" | "ok";

const toneStyles: Record<Tone, { panel: string; value: string; sub: string; icon: string }> = {
  neutral: {
    panel: "",
    value: "text-foreground",
    sub: "text-muted-foreground",
    icon: "text-muted-foreground/30 group-hover:text-muted-foreground/60",
  },
  critical: {
    panel: "border-signal-critical/30",
    value: "text-signal-critical",
    sub: "text-signal-critical/70",
    icon: "text-signal-critical/50",
  },
  ok: {
    panel: "border-signal-ok/25",
    value: "text-signal-ok",
    sub: "text-signal-ok/70",
    icon: "text-signal-ok/40 group-hover:text-signal-ok/70",
  },
};

export type KpiCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone?: Tone;
  filledIcon?: boolean;
};

export function KpiCard({ label, value, sub, icon, tone = "neutral", filledIcon }: KpiCardProps) {
  const t = toneStyles[tone];
  return (
    <article className={`glass-panel group relative overflow-hidden p-5 ${t.panel}`}>
      {tone === "critical" && (
        <div className="absolute inset-0 bg-gradient-to-br from-signal-critical/10 to-transparent" />
      )}
      <div className="relative z-10 mb-4">
        <h3 className="chip-label tracking-[0.12em]">{label}</h3>
      </div>
      <div className="relative z-10 mt-2">
        <p className={`font-display text-display-lg ${t.value}`}>{value}</p>
        <p className={`mt-1 font-mono text-label-sm uppercase tracking-[0.12em] ${t.sub}`}>{sub}</p>
      </div>
      <span
        aria-hidden="true"
        className={`material-symbols-outlined absolute right-4 bottom-4 text-3xl transition-colors ${t.icon}${filledIcon ? " filled" : ""}`}
      >
        {icon}
      </span>
    </article>
  );
}
