import { useState, useEffect, useCallback } from "react";

export type VoiceSpeedOption = "ultra-slow" | "slow" | "normal" | "fast" | "ultra-fast";

export const VOICE_SPEED_MAP: Record<VoiceSpeedOption, { label: string; rate: number; multiplier: string }> = {
  "ultra-slow": { label: "Ultra Slow", rate: 0.75, multiplier: "0.75x" },
  "slow": { label: "Slow", rate: 0.90, multiplier: "0.90x" },
  "normal": { label: "Normal", rate: 1.18, multiplier: "1.18x" },
  "fast": { label: "Fast", rate: 1.40, multiplier: "1.40x" },
  "ultra-fast": { label: "Ultra Fast", rate: 1.75, multiplier: "1.75x" },
};

export interface SystemConfig {
  voiceSpeed: VoiceSpeedOption;
  defaultLanguage: "en" | "kn";
  autoPlayVoice: boolean;
  repeatOffenderThreshold: number;
  clusterSensitivity: "fine" | "balanced" | "broad";
  alertChimes: boolean;
  baseMapStyle: "dark" | "satellite" | "midnight";
  autoRefreshInterval: 0 | 30 | 60;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  voiceSpeed: "normal",
  defaultLanguage: "en",
  autoPlayVoice: false,
  repeatOffenderThreshold: 85,
  clusterSensitivity: "balanced",
  alertChimes: true,
  baseMapStyle: "dark",
  autoRefreshInterval: 30,
};

const STORAGE_KEY = "lumina_system_configuration";

export function getSystemConfig(): SystemConfig {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SYSTEM_CONFIG;
    return { ...DEFAULT_SYSTEM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SYSTEM_CONFIG;
  }
}

export function saveSystemConfig(updates: Partial<SystemConfig>): SystemConfig {
  const current = getSystemConfig();
  const next = { ...current, ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("lumina_config_changed", { detail: next }));
  } catch {}
  return next;
}

export function getPlaybackRateFromConfig(speed: VoiceSpeedOption = "normal"): number {
  return VOICE_SPEED_MAP[speed]?.rate ?? 1.18;
}

export function useSystemConfig() {
  const [config, setConfigState] = useState<SystemConfig>(() => getSystemConfig());

  useEffect(() => {
    const handleStorage = () => setConfigState(getSystemConfig());
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<SystemConfig>;
      if (customEvent.detail) setConfigState(customEvent.detail);
      else setConfigState(getSystemConfig());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("lumina_config_changed", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("lumina_config_changed", handleCustom);
    };
  }, []);

  const updateConfig = useCallback((updates: Partial<SystemConfig>) => {
    const updated = saveSystemConfig(updates);
    setConfigState(updated);
  }, []);

  const resetConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("lumina_config_changed", { detail: DEFAULT_SYSTEM_CONFIG }));
    } catch {}
    setConfigState(DEFAULT_SYSTEM_CONFIG);
  }, []);

  return { config, updateConfig, resetConfig };
}
