import { useEffect } from "react";
import { toast } from "sonner";

export type ProfileModalType = "profile" | "model" | "tokens" | "workspace" | "passkeys" | null;

interface ProfileDetailModalProps {
  type: ProfileModalType;
  onClose: () => void;
  activeWorkspace?: string;
  onWorkspaceChange?: (workspace: string) => void;
}

export function ProfileDetailModal({
  type,
  onClose,
  activeWorkspace = "Karnataka State Command (Primary Node)",
  onWorkspaceChange,
}: ProfileDetailModalProps) {
  useEffect(() => {
    if (!type) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [type, onClose]);

  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#090b12]/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-3xl animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        {/* 1. Officer Profile View */}
        {type === "profile" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-500 to-blue-600 font-sans text-base font-bold text-white shadow-lg">
                RK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Inspector Rajesh Kumar</h2>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                    ON DUTY
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Badge #4521 · Karnataka State Police
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Division</span>
                <span className="font-semibold text-white mt-1 block">Cyber &amp; Strategic Intel</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Clearance</span>
                <span className="font-semibold text-blue-400 mt-1 block">Level 3 · Command Admin</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Station HQ</span>
                <span className="font-semibold text-white mt-1 block">KSP Central Command, Bengaluru</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Jurisdiction</span>
                <span className="font-semibold text-white mt-1 block">209 Police Stations (Statewide)</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs font-mono text-zinc-300 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Official Email:</span>
                <span className="text-white">r.kumar@lumina.ai</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Authentication:</span>
                <span className="text-emerald-400 font-bold">FIDO2 Biometric Passkey Enrolled</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Active Model Context View */}
        {type === "model" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <span className="material-symbols-outlined text-xl">hub</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Active Model &amp; Graph Context</h2>
                <p className="text-xs text-zinc-400 font-mono">Live Neural &amp; Spatial Pipeline</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-[#0c0e16] p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Primary LLM Engine</span>
                  <span className="font-bold text-white">Google Gemini Flash</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Connected Station Feeds</span>
                  <span className="font-mono font-bold text-emerald-400">124 Nodes Live</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Telemetry Master Records</span>
                  <span className="font-mono font-bold text-white">5,005 FIRs Indexed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">ST-DBSCAN Clusters</span>
                  <span className="font-mono font-bold text-cyan-400">32 Spatial Zones</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Pipeline Latency</span>
                  <span className="font-mono text-emerald-400">~380ms Sub-Second</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. API Token Usage View */}
        {type === "tokens" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <span className="material-symbols-outlined text-xl">data_usage</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">API Quota &amp; Token Meter</h2>
                <p className="text-xs text-zinc-400 font-mono">Catalyst Serverless Telemetry</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-zinc-400">Daily Quota Consumption</span>
                  <span className="text-amber-400 font-bold">142,500 / 230,000 (62%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-blue-500 to-amber-500" />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0c0e16] p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Rate Limit Capacity</span>
                  <span className="font-bold text-white">60 Requests / Minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Serverless Runtime</span>
                  <span className="font-mono text-white">Python 3.11 (FastAPI on Catalyst)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Vector Embeddings</span>
                  <span className="font-mono text-emerald-400">Active &amp; Balanced</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Switch Workspace View */}
        {type === "workspace" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                <span className="material-symbols-outlined text-xl">swap_horiz</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Switch Command Workspace</h2>
                <p className="text-xs text-zinc-400 font-mono">Select Active Regional Node</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: "Karnataka State Command (Primary Node)", badge: "STATEWIDE", active: activeWorkspace.includes("Primary") },
                { name: "Bengaluru Urban Command Node", badge: "URBAN", active: activeWorkspace.includes("Bengaluru") },
                { name: "Belagavi Northern Range Command", badge: "NORTH", active: activeWorkspace.includes("Belagavi") },
                { name: "Coastal Karnataka Maritime Range", badge: "MARITIME", active: activeWorkspace.includes("Coastal") },
              ].map((ws) => (
                <button
                  key={ws.name}
                  type="button"
                  onClick={() => {
                    onWorkspaceChange?.(ws.name);
                    toast.success("Workspace Switched", {
                      description: `Connected to ${ws.name}.`,
                    });
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    ws.active
                      ? "border-blue-500/50 bg-blue-500/15 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                      : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`size-2 rounded-full ${ws.active ? "bg-blue-400 shadow-[0_0_6px_#60a5fa]" : "bg-zinc-600"}`} />
                    <span className="font-semibold">{ws.name}</span>
                  </div>
                  <span className="rounded font-mono text-[9px] font-bold px-2 py-0.5 border border-white/10 bg-black/40 text-zinc-400">
                    {ws.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Reset Passkeys View */}
        {type === "passkeys" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <span className="material-symbols-outlined text-xl">fingerprint</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Biometrics &amp; Passkey Credentials</h2>
                <p className="text-xs text-zinc-400 font-mono">FIDO2 Hardware Security</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed">
                Your account is currently secured with hardware-backed FIDO2 / WebAuthn passkey authentication registered to Karnataka State Police workstation terminals.
              </p>
              <div className="rounded-xl border border-white/10 bg-[#0c0e16] p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Hardware Token:</span>
                  <span className="font-bold text-white">YubiKey / Platform TPM 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Enrollment Date:</span>
                  <span className="font-mono text-zinc-300">Aug 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">Passkey Status:</span>
                  <span className="font-mono text-emerald-400 font-bold">ACTIVE &amp; VERIFIED</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                toast.success("Passkey Re-Enrollment Initiated", {
                  description: "Insert your hardware key or touch fingerprint sensor on your next login.",
                });
                onClose();
              }}
              className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/20 py-2.5 font-mono text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/30 cursor-pointer shadow-lg"
            >
              Re-Enroll Biometric Passkey
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-5 py-1.5 text-xs font-bold text-black transition-colors hover:bg-zinc-200 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
