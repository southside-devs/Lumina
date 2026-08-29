import { useEffect, useState } from "react";

interface TacticalLoaderProps {
  onComplete?: () => void;
  durationMs?: number;
  label?: string;
}

export function TacticalLoader({
  onComplete,
  durationMs = 1500,
  label = "LOADING",
}: TacticalLoaderProps) {
  const [progress, setProgress] = useState(0);
  const totalBars = 16;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete?.();
        }, 250);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const activeBars = Math.round((progress / 100) * totalBars);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050608] text-white select-none font-mono">
      {/* Top HUD Row */}
      <div className="flex w-full max-w-2xl items-center justify-between px-8 text-xs text-zinc-400">
        <span className="rounded border border-white/20 bg-white/[0.03] px-2.5 py-1 tracking-widest text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          [ SYS.BOOT ]
        </span>

        <span className="font-bold tracking-[0.35em] text-zinc-200">{label}</span>

        <span className="rounded border border-white/20 bg-white/[0.03] px-2.5 py-1 tracking-widest text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          [ KSP.AI ]
        </span>
      </div>

      {/* Main Center Reticle & Progress HUD */}
      <div className="relative my-12 flex w-full max-w-3xl items-center justify-between px-6">
        {/* Left HUD Bracket */}
        <div className="flex items-center gap-2 text-zinc-600">
          <div className="h-16 w-4 border-t-2 border-b-2 border-l-2 border-zinc-700" />
          <span className="text-[10px] tracking-widest">:::</span>
          <span className="size-2.5 border border-zinc-600 bg-zinc-800" />
          <div className="h-px w-8 bg-zinc-700" />
        </div>

        {/* Glowing Segmented Progress Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalBars }).map((_, i) => {
            const isFilled = i < activeBars;
            return (
              <div
                key={i}
                className={`h-12 w-3 sm:h-14 sm:w-4 rounded-xs transition-all duration-75 ${
                  isFilled
                    ? "bg-white shadow-[0_0_14px_rgba(255,255,255,0.9),0_0_24px_rgba(255,255,255,0.5)] opacity-100 scale-y-100"
                    : "bg-zinc-800/40 border border-zinc-700/50 opacity-30 scale-y-90"
                }`}
              />
            );
          })}
        </div>

        {/* Right HUD Bracket */}
        <div className="flex items-center gap-2 text-zinc-600">
          <div className="h-px w-8 bg-zinc-700" />
          <span className="size-2.5 border border-zinc-600 bg-zinc-800" />
          <span className="text-[10px] tracking-widest">:::</span>
          <div className="h-16 w-4 border-t-2 border-b-2 border-r-2 border-zinc-700" />
        </div>
      </div>

      {/* Big Center HUD Counter */}
      <div className="relative">
        <div className="flex items-center justify-center rounded-lg border border-white/20 bg-black/80 px-6 py-2 shadow-[0_0_30px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">
            {progress}
          </span>
        </div>
      </div>

      {/* Bottom Telemetry Coordinate Row */}
      <div className="mt-12 flex items-center gap-6 font-mono text-[11px] tracking-widest text-zinc-400">
        <span>56 34</span>
        <span className="text-zinc-500">·</span>
        <span>65 45</span>
        <span className="text-zinc-500">·</span>
        <span>22 42</span>
        <span className="text-zinc-500">·</span>
        <span>47 35</span>
      </div>
    </div>
  );
}
