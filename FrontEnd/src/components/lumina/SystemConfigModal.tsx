import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useSystemConfig,
  VOICE_SPEED_MAP,
  type VoiceSpeedOption,
  getPlaybackRateFromConfig,
} from "@/lib/config";
import { api } from "@/lib/api";

interface SystemConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemConfigModal({ isOpen, onClose }: SystemConfigModalProps) {
  const { config, updateConfig, resetConfig } = useSystemConfig();
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<"voice" | "threat" | "map" | "diagnostics">("voice");

  useEffect(() => {
    if (!isOpen) {
      setIsPlayingTestAudio(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    if (isPlayingTestAudio) return;
    setIsPlayingTestAudio(true);

    try {
      const sampleText =
        config.defaultLanguage === "kn"
          ? "ಲ್ಯುಮಿನಾ ಧ್ವನಿ ಪರೀಕ್ಷೆ ಯಶಸ್ವಿಯಾಗಿದೆ."
          : `Lumina neural voice playback rate set to ${VOICE_SPEED_MAP[config.voiceSpeed].label}.`;

      const audioUrl = api.getTTSAudioUrl(sampleText, config.defaultLanguage);
      const audio = new Audio(audioUrl);
      audio.playbackRate = getPlaybackRateFromConfig(config.voiceSpeed);

      audio.onended = () => setIsPlayingTestAudio(false);
      audio.onerror = () => {
        setIsPlayingTestAudio(false);
        toast.error("Voice preview unavailable");
      };

      audio.play().catch(() => setIsPlayingTestAudio(false));
    } catch {
      setIsPlayingTestAudio(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem("lumina_recent_searches");
      localStorage.removeItem("lumina_pinned_items");
      toast.success("Cleared local search history & pinned priority dossiers");
    } catch {
      toast.error("Failed to clear local cache");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-zinc-800 bg-[#0f1013] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
              <span className="material-symbols-outlined text-xl">settings</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <span>System Configuration</span>
                <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  v3.4.2 · Node KA-01-HQ
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                Customize operational parameters, AI voice speed, threat thresholds & offline cache.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close configuration modal"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            <span className="font-mono text-[10px]">ESC</span>
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center border-b border-zinc-800 bg-[#131418] px-5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "voice"
                ? "border-emerald-400 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">record_voice_over</span>
            <span>AI Voice & Language</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("threat")}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "threat"
                ? "border-amber-400 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">crisis_alert</span>
            <span>Threats & Hotspots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "map"
                ? "border-sky-400 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">map</span>
            <span>Map & Display</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "diagnostics"
                ? "border-purple-400 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">dns</span>
            <span>Node Status</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* 1. Voice & Language Tab */}
          {activeTab === "voice" && (
            <div className="space-y-5">
              {/* Voice Speed Selection */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white font-sans block">
                      AI TTS Neural Voice Playback Speed
                    </label>
                    <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                      Adjust speech rate for analytical briefings and audio playback.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    disabled={isPlayingTestAudio}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-mono text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isPlayingTestAudio ? "graphic_eq" : "volume_up"}
                    </span>
                    <span>{isPlayingTestAudio ? "Playing..." : "Test Audio"}</span>
                  </button>
                </div>

                {/* 5 Discrete Presets (Clean text labels without raw multipliers) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono">
                  {(Object.keys(VOICE_SPEED_MAP) as VoiceSpeedOption[]).map((key) => {
                    const item = VOICE_SPEED_MAP[key];
                    const isSelected = config.voiceSpeed === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          updateConfig({ voiceSpeed: key });
                          toast.success(`Voice speed set to ${item.label}`);
                        }}
                        className={`flex items-center justify-center py-3 px-2 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-950/70 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold"
                            : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Default Language Preference */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-white font-sans block">
                    Default Intelligence Language
                  </label>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Select default primary language for Gemini AI summaries & voice synthesis.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({ defaultLanguage: "en" });
                      toast.success("Default language set to English (India)");
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      config.defaultLanguage === "en"
                        ? "bg-white text-black font-bold border-white shadow"
                        : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>🇮🇳 English (India)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({ defaultLanguage: "kn" });
                      toast.success("Default language set to ಕನ್ನಡ (Kannada)");
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      config.defaultLanguage === "kn"
                        ? "bg-white text-black font-bold border-white shadow"
                        : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>🇮🇳 ಕನ್ನಡ (Kannada)</span>
                  </button>
                </div>
              </div>

              {/* Auto-Play Voice Briefings Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <div>
                  <div className="text-xs font-bold text-white font-sans">
                    Auto-Play Briefing Audio
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Automatically speak aloud when opening AI analytical summaries.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig({ autoPlayVoice: !config.autoPlayVoice })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    config.autoPlayVoice ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      config.autoPlayVoice ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* 2. Threats & Hotspots Tab */}
          {activeTab === "threat" && (
            <div className="space-y-5">
              {/* Repeat Offender Threshold */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white font-sans block">
                      Repeat Offender Flagging Score Threshold
                    </label>
                    <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                      Minimum threat score required to trigger urgent supervisory watchlist alerts.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-red-400 bg-red-950/80 border border-red-800/50 px-2 py-0.5 rounded">
                    Score ≥ {config.repeatOffenderThreshold}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  {[75, 80, 85, 90].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => {
                        updateConfig({ repeatOffenderThreshold: score });
                        toast.success(`Repeat offender threshold set to ≥ ${score}`);
                      }}
                      className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        config.repeatOffenderThreshold === score
                          ? "bg-red-950/70 border-red-500/80 text-red-300 font-bold"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {score} {score === 85 ? "(Standard)" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* ST-DBSCAN Cluster Sensitivity */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-white font-sans block">
                    ST-DBSCAN Spatiotemporal Clustering Radius
                  </label>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Determines spatial density grouping for tactical crime hotspot identification.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { id: "fine" as const, label: "Fine (500m)", desc: "Precinct Micro-hotspots" },
                    { id: "balanced" as const, label: "Balanced (1.2km)", desc: "Standard Jurisdiction" },
                    { id: "broad" as const, label: "Broad (2.5km)", desc: "Statewide Macro-clusters" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => updateConfig({ clusterSensitivity: lvl.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        config.clusterSensitivity === lvl.id
                          ? "bg-amber-950/70 border-amber-500/80 text-amber-300 font-bold"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="font-semibold">{lvl.label}</div>
                      <div className="text-[10px] text-zinc-500 font-normal mt-0.5">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Alert Chimes */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <div>
                  <div className="text-xs font-bold text-white font-sans">
                    Audio Threat Chimes
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Play a tactical audio chime when critical high-threat FIRs are filed.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig({ alertChimes: !config.alertChimes })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    config.alertChimes ? "bg-amber-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      config.alertChimes ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* 3. Map & Display Tab */}
          {activeTab === "map" && (
            <div className="space-y-5">
              {/* Base Map Canvas Style */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-white font-sans block">
                    Default Cartographic Base Map
                  </label>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Select default GIS tile layer for the Live Hotspot Tactical Map.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { id: "dark" as const, label: "Esri Dark Canvas", desc: "Recommended Night Operations" },
                    { id: "midnight" as const, label: "Tactical Midnight", desc: "Monochrome Low-contrast" },
                    { id: "satellite" as const, label: "Satellite Imagery", desc: "High-Resolution Terrain" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        updateConfig({ baseMapStyle: m.id });
                        toast.success(`Base map style set to ${m.label}`);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        config.baseMapStyle === m.id
                          ? "bg-sky-950/70 border-sky-500/80 text-sky-300 font-bold"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="font-semibold">{m.label}</div>
                      <div className="text-[10px] text-zinc-500 font-normal mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemetry Polling Rate */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-white font-sans block">
                    Background Data Polling Frequency
                  </label>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Frequency for checking newly reported statewide FIRs and cluster shifts.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { val: 30 as const, label: "Real-time (30s)" },
                    { val: 60 as const, label: "Standard (60s)" },
                    { val: 0 as const, label: "Manual Only" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => updateConfig({ autoRefreshInterval: p.val })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        config.autoRefreshInterval === p.val
                          ? "bg-white text-black font-bold border-white shadow"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Diagnostics & Cache Tab */}
          {activeTab === "diagnostics" && (
            <div className="space-y-5">
              {/* Telemetry Info Panel */}
              <div className="rounded-xl border border-zinc-800 bg-[#121316] p-4 space-y-2.5 font-mono text-xs text-zinc-300">
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-500">Node Designation:</span>
                  <span className="text-white font-semibold">KA-01-HQ (Statewide Command)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-500">Database Engine:</span>
                  <span className="text-emerald-400">Dual Engine: SQLite / ZCQL (5,005 FIRs)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-500">Encryption Level:</span>
                  <span className="text-white">AES-256 GCM (Encrypted Local State)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">AI Model Backbone:</span>
                  <span className="text-sky-400 font-semibold">Gemini 2.5 Flash Bilingual RAG</span>
                </div>
              </div>

              {/* Cache Management Action Buttons */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-white font-sans block">
                    Local Storage & Shift Cache Management
                  </label>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Clear local pinned dossiers, recent search history, or restore factory command defaults.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">mop</span>
                    <span>Clear Search & Pins</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetConfig();
                      toast.success("Restored all configuration to factory defaults");
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-red-900/50 bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    <span>Reset to Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3.5 bg-zinc-950 font-mono text-xs text-zinc-500">
          <span>Settings automatically saved to encrypted local session</span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-white text-black font-semibold px-4 py-2 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
