import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KspEmblem } from "@/components/lumina/KspEmblem";
import { LuminaLogo } from "@/components/lumina/LuminaLogo";
import { TacticalLoader } from "@/components/lumina/TacticalLoader";
import { useAuth, type OfficerUser } from "@/lib/auth";

interface LoginSearchParams {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => {
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "LUMINA — Officer Authentication | Karnataka State Police" },
      {
        name: "description",
        content: "Enterprise biometric and badge authentication portal for Lumina Command Center.",
      },
    ],
  }),
  component: LoginPage,
});

const DEMO_PRESETS = [
  {
    badge: "KSP-4521",
    pass: "Karnataka@Police2026",
    name: "Insp. Rajesh Kumar",
    label: "Insp. R. Kumar · Admin",
    rank: "Police Inspector",
    unit: "Cyber & Strategic Command HQ",
  },
  {
    badge: "KSP-1092",
    pass: "Cyber@Command2026",
    name: "SP Ananya Sharma",
    label: "SP A. Sharma · Analyst",
    rank: "Superintendent of Police",
    unit: "CID Cyber Crime Division",
  },
  {
    badge: "KSP-8820",
    pass: "Khaki@Safe2026",
    name: "SHO Vikram Rao",
    label: "SHO V. Rao · Station Head",
    rank: "Station House Officer",
    unit: "Indiranagar Police Station",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { login, register, ssoLogin, isAuthenticated, user } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [badgeId, setBadgeId] = useState("KSP-4521");
  const [password, setPassword] = useState("Karnataka@Police2026");
  const [officerName, setOfficerName] = useState("Inspector Rajesh Kumar");
  const [stationUnit, setStationUnit] = useState("Cyber & Strategic Command HQ, Bengaluru");
  const [rank, setRank] = useState("Police Inspector");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isBooting, setIsBooting] = useState(false);
  const [bootLabel, setBootLabel] = useState("INITIALIZING");
  const [pendingUser, setPendingUser] = useState<OfficerUser | null>(null);

  // Parse redirect target if user was bounced from a protected route
  const getRedirectTarget = () => {
    if (
      search.redirect &&
      search.redirect.startsWith("/") &&
      search.redirect !== "/login" &&
      !search.redirect.startsWith("/login?")
    ) {
      return search.redirect;
    }
    try {
      const hash = window.location.hash || "";
      const queryIdx = hash.indexOf("?");
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.slice(queryIdx));
        const redir = params.get("redirect");
        if (redir && redir.startsWith("/") && redir !== "/login" && !redir.startsWith("/login?")) return redir;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const redir = searchParams.get("redirect");
      if (redir && redir.startsWith("/") && redir !== "/login" && !redir.startsWith("/login?")) return redir;
    } catch {
      // Fallback to default
    }
    return "/";
  };

  const redirectTarget = getRedirectTarget();

  // If user is already authenticated, redirect to target immediately
  useEffect(() => {
    if (isAuthenticated && !isBooting) {
      navigate({ to: redirectTarget });
    }
  }, [isAuthenticated, isBooting, navigate, redirectTarget]);

  const handleSelectPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setBadgeId(preset.badge);
    setPassword(preset.pass);
    setOfficerName(preset.name);
    setRank(preset.rank);
    setStationUnit(preset.unit);
    setErrorMessage(null);
  };

  const handleAccessSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanBadge = badgeId.trim().toUpperCase();
    if (!cleanBadge) {
      setErrorMessage("Please provide your Karnataka Police Badge ID.");
      toast.error("Authentication Error", { description: "Please enter your Badge ID." });
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your security access password.");
      toast.error("Authentication Error", { description: "Password cannot be empty." });
      return;
    }

    if (isSignUp) {
      if (!officerName.trim()) {
        setErrorMessage("Please enter your official Officer Name & Rank.");
        return;
      }
      if (password.length < 8) {
        setErrorMessage("Security key must be at least 8 characters long.");
        return;
      }

      try {
        setBootLabel("ENROLLING OFFICER IDENTITY");
        setIsBooting(true);

        const newUser = await register({
          badgeId: cleanBadge,
          password,
          officerName: officerName.trim(),
          stationUnit: stationUnit.trim(),
          rank: rank.trim(),
        });

        setPendingUser(newUser);
      } catch (err: unknown) {
        setIsBooting(false);
        const msg = err instanceof Error ? err.message : "Failed to register credentials.";
        setErrorMessage(msg);
        toast.error("Enrollment Rejected", { description: msg });
      }
    } else {
      try {
        setBootLabel("AUTHENTICATING OFFICER KEY");
        setIsBooting(true);

        const loggedInUser = await login(cleanBadge, password);
        setPendingUser(loggedInUser);
      } catch (err: unknown) {
        setIsBooting(false);
        const msg = err instanceof Error ? err.message : "Invalid Badge ID or Security Key.";
        setErrorMessage(msg);
        toast.error("Access Denied", { description: msg });
      }
    }
  };

  const handleSso = async () => {
    setErrorMessage(null);
    try {
      setBootLabel("KSP PORTAL SSO");
      setIsBooting(true);
      const ssoUser = await ssoLogin();
      setPendingUser(ssoUser);
    } catch (err: unknown) {
      setIsBooting(false);
      const msg = err instanceof Error ? err.message : "SSO Gateway unreachable.";
      setErrorMessage(msg);
      toast.error("SSO Fault", { description: msg });
    }
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    const activeOfficer = pendingUser || user;
    toast.success(isSignUp ? "Officer Key Created" : "Access Granted", {
      description: `Welcome, ${activeOfficer?.name || "Officer"}. Command console initialized.`,
    });
    navigate({ to: redirectTarget });
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
                CRIME INTELLIGENCE PLATFORM
              </p>
            </div>
          </div>

          {/* Middle Body Copy */}
          <div className="my-8 space-y-3">
            <p className="text-sm font-medium leading-relaxed text-zinc-300">
              Statewide Crime Analytics, Spatiotemporal Hotspot Detection &amp; Syndicate Topology.
            </p>
            <p className="text-xs text-zinc-400">
              Authorized law enforcement personnel only. Sessions are cryptographically signed and audited.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34C759]" />
                Security Gateway Active · NIST PBKDF2-SHA256
              </span>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="space-y-2 border-t border-white/[0.06] pt-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
              Quick Officer Profile Selector:
            </span>
            <div className="flex flex-col gap-1.5">
              {DEMO_PRESETS.map((preset) => {
                const isSelected = badgeId === preset.badge;
                return (
                  <button
                    key={preset.badge}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? "border border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        : "border border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="truncate">{preset.label}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0 ml-2 font-bold">{preset.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Sign In / Sign Up Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 bg-[#0c0d13]/80">
          <div>
            {/* Header with Switcher */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {isSignUp ? "Officer Enrollment" : "Command Sign In"}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {isSignUp
                    ? "Register officer credentials in Lumina Vault"
                    : "Access the Karnataka Command Center"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
              >
                {isSignUp ? "Sign In instead" : "New Officer?"}
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 animate-in fade-in duration-150">
                <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
                <span className="font-mono text-[11px] leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleAccessSystem} className="mt-6 space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                      Officer Name &amp; Rank
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                        person
                      </span>
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="e.g. DySP Ramesh Bellary"
                        className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                      Station / Division Unit
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                        local_police
                      </span>
                      <input
                        type="text"
                        value={stationUnit}
                        onChange={(e) => setStationUnit(e.target.value)}
                        placeholder="e.g. Belagavi North Division"
                        className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Karnataka Police Badge ID
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                    badge
                  </span>
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => {
                      setBadgeId(e.target.value.toUpperCase());
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. KSP-4521"
                    className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Security Password Key
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter Security Password"
                    className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-11 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                    required
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
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 px-6 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] transition-all hover:bg-zinc-200 active:scale-[0.985] cursor-pointer"
                >
                  <span>{isSignUp ? "Register Officer Key & Enter" : "Authenticate & Access Console"}</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-150 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSso}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-2.5 px-6 text-xs font-semibold text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-[0.985] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-blue-400">vpn_key</span>
                  <span>Karnataka State Police SSO Gateway</span>
                </button>
              </div>
            </form>
          </div>

          {/* Trouble signing in footer */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() =>
                toast.info("State Cyber Command Admin Support", {
                  description:
                    "Contact the KSP State Cyber Command Helpdesk at support@ksp.gov.in or Internal Ext #4001.",
                })
              }
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300 hover:underline cursor-pointer font-mono text-[11px]"
            >
              Trouble authenticating? Contact Cyber Command Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
