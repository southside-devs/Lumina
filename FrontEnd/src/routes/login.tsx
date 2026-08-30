import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KspEmblem } from "@/components/lumina/KspEmblem";
import { LuminaLogo } from "@/components/lumina/LuminaLogo";
import { TacticalLoader } from "@/components/lumina/TacticalLoader";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "LUMINA — Sign In | Karnataka State Police" },
      {
        name: "description",
        content: "Secure biometric and badge authentication portal for Lumina Command Center.",
      },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [badgeId, setBadgeId] = useState("KSP-4521");
  const [password, setPassword] = useState("Karnataka@Police2026");
  const [officerName, setOfficerName] = useState("Insp. R. Kumar");
  const [stationUnit, setStationUnit] = useState("Cyber & Strategic Command HQ");
  const [showPassword, setShowPassword] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLabel, setBootLabel] = useState("INITIALIZING");

  const handleAccessSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId.trim()) {
      toast.error("Authentication Error", { description: "Please enter your Badge ID." });
      return;
    }
    setBootLabel(isSignUp ? "CREATING OFFICER KEY" : "AUTHENTICATING");
    setIsBooting(true);
  };

  const handleSso = () => {
    setBootLabel("KSP PORTAL SSO");
    setIsBooting(true);
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    toast.success(isSignUp ? "Officer Registered" : "Access Granted", {
      description: `Welcome back, ${officerName || "Officer"}. Command console online.`,
    });
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#07080b] p-4 sm:p-6 overflow-hidden select-none font-sans text-white">
      {/* Tactical Boot Loader Overlay */}
      {isBooting && <TacticalLoader label={bootLabel} onComplete={handleBootComplete} />}

      {/* Subtle Background Radial Aura */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />

      {/* Main Split Authentication Card */}
      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-[#0c0d12]/95 shadow-[0_30px_100px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-3xl">
        {/* Left Side: KSP Branding & Platform Info */}
        <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#08090e]/90 p-8 sm:p-10">
          <div>
            {/* KSP Emblem & State Police Title */}
            <div className="flex items-center gap-3.5">
              <KspEmblem className="size-11 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-[15px] font-black uppercase tracking-wider text-white">
                  KARNATAKA STATE
                </span>
                <span className="font-display text-[15px] font-black uppercase tracking-wider text-white">
                  POLICE
                </span>
              </div>
            </div>

            {/* Lumina Platform Big Typography */}
            <div className="mt-8">
              <LuminaLogo className="h-9 sm:h-11 w-auto text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]" />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                PLATFORM
              </p>
            </div>
          </div>

          {/* Middle Body Copy */}
          <div className="my-10 space-y-3">
            <p className="text-sm font-medium leading-relaxed text-zinc-300">
              Strategic Intelligence & Crime Analytics Platform
            </p>
            <p className="text-xs text-zinc-400">
              Developed for the Karnataka State Police
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34C759]" />
                Authorized Personnel Only.
              </span>
            </div>
          </div>

          {/* Footer Attribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              <span>DEVELOPED BY SOUTHSIDE DEVS</span>
            </div>
            <div className="h-1 w-8 rounded-full bg-zinc-800" />
          </div>
        </div>

        {/* Right Side: Sign In / Sign Up Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 bg-[#0c0d13]/80">
          <div>
            {/* Header with Switcher */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {isSignUp ? "Create Officer Account" : "Sign In"}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {isSignUp ? "Register with State Police credentials" : "Access the Command Center"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
              >
                {isSignUp ? "Sign In instead" : "New Officer?"}
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleAccessSystem} className="mt-8 space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                      Officer Name & Rank
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                        person
                      </span>
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="e.g. Insp. R. Kumar"
                        className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                      Station / Division
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                        local_police
                      </span>
                      <input
                        type="text"
                        value={stationUnit}
                        onChange={(e) => setStationUnit(e.target.value)}
                        placeholder="e.g. Bengaluru Central Command"
                        className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Badge ID
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                    badge
                  </span>
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="Enter Badge ID"
                    className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-11 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 px-6 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] transition-all hover:bg-zinc-200 active:scale-[0.985] cursor-pointer"
                >
                  <span>{isSignUp ? "Register & Enter System" : "Access System"}</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-150 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSso}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-3 px-6 text-sm font-semibold text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-[0.985] cursor-pointer"
                >
                  <span>KSP Portal SSO</span>
                </button>
              </div>
            </form>
          </div>

          {/* Trouble signing in footer */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() =>
                toast.info("Command Center Admin Support", {
                  description:
                    "Contact the KSP State Cyber Command Helpdesk at support@ksp.gov.in or Ext #4001.",
                })
              }
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300 hover:underline cursor-pointer"
            >
              Trouble signing in? Contact System Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
