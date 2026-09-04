import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KspEmblem } from "@/components/lumina/KspEmblem";
import { LuminaLogo } from "@/components/lumina/LuminaLogo";
import { TacticalLoader } from "@/components/lumina/TacticalLoader";
import { PasswordRecoveryModal } from "@/components/lumina/PasswordRecoveryModal";
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
        content: "Enterprise law enforcement authentication portal for Lumina Strategic Crime Intelligence.",
      },
    ],
  }),
  component: LoginPage,
});

const REMEMBER_BADGE_KEY = "lumina_remembered_badge";

export function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { login, register, isAuthenticated, user } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);

  // Remembered badge ID or clean empty state
  const [rememberBadge, setRememberBadge] = useState(() => {
    return Boolean(localStorage.getItem(REMEMBER_BADGE_KEY));
  });
  const [badgeId, setBadgeId] = useState(() => {
    return localStorage.getItem(REMEMBER_BADGE_KEY) || "";
  });

  const [password, setPassword] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [stationUnit, setStationUnit] = useState("");
  const [rank, setRank] = useState("Police Inspector");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

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
      // Fallback
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

  const handleAccessSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = badgeId.trim();
    if (!cleanIdentifier) {
      setErrorMessage("Please enter your Karnataka Police Badge ID or Official Email.");
      toast.error("Authentication Error", { description: "Identifier cannot be empty." });
      return;
    }

    // Normalize badge formatting (e.g., 'KSP - 0143' -> 'KSP-0143') while keeping emails intact
    const normalizedIdentifier = cleanIdentifier.includes("@")
      ? cleanIdentifier.toLowerCase()
      : cleanIdentifier.replace(/\s*-\s*/g, "-").replace(/\s+/g, "").toUpperCase();

    if (!password) {
      setErrorMessage("Please enter your security access key.");
      toast.error("Authentication Error", { description: "Password cannot be empty." });
      return;
    }

    // Save or clear remembered badge
    if (rememberBadge && !cleanIdentifier.includes("@")) {
      localStorage.setItem(REMEMBER_BADGE_KEY, normalizedIdentifier);
    } else if (!rememberBadge) {
      localStorage.removeItem(REMEMBER_BADGE_KEY);
    }

    if (isSignUp) {
      if (!officerName.trim()) {
        setErrorMessage("Please enter your official Officer Name & Rank.");
        return;
      }
      if (!email.trim() || !email.includes("@") || !email.includes(".")) {
        setErrorMessage("Please enter a valid official email address for account recovery.");
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
          badgeId: normalizedIdentifier,
          password,
          officerName: officerName.trim(),
          stationUnit: stationUnit.trim() || "Karnataka State Police",
          rank: rank.trim() || "Police Inspector",
          email: email.trim().toLowerCase(),
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

        const loggedInUser = await login(normalizedIdentifier, password);
        setPendingUser(loggedInUser);
      } catch (err: unknown) {
        setIsBooting(false);
        const msg = err instanceof Error ? err.message : "Invalid Badge ID / Email or Security Key.";
        setErrorMessage(msg);
        toast.error("Access Denied", { description: msg });
      }
    }
  };

  const handleSso = () => {
    toast.info("KSP Intranet SSO", {
      description: "Direct Single Sign-On requires official police VPN or PKI smartcard hardware. Please authenticate with your Badge ID or Official Email.",
    });
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    const activeOfficer = pendingUser || user;
    toast.success(isSignUp ? "Officer Identity Enrolled" : "Access Granted", {
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
        {/* Left Side: KSP Branding & Official Security Notice */}
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
              Statewide Crime Analytics, Spatiotemporal Hotspot Detection &amp; Syndicate Relational Topology.
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

          {/* Statutory Security Advisory & System Compliance Notice */}
          <div className="space-y-3.5 border-t border-white/[0.06] pt-5">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                <span className="material-symbols-outlined text-sm">gavel</span>
                Restricted Law Enforcement System
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400">
                Unauthorized access to KSP Lumina Command infrastructure is strictly prohibited. Access attempts are digitally fingerprinted, logged, and prosecutable under the Information Technology Act and Bharatiya Nyaya Sanhita (BNS).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
              <div className="rounded-lg border border-white/5 bg-white/[0.01] p-2">
                <span className="text-zinc-500 block text-[9px]">ENCRYPTION</span>
                <span className="font-bold text-zinc-300">PBKDF2-SHA256</span>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.01] p-2">
                <span className="text-zinc-500 block text-[9px]">SESSION</span>
                <span className="font-bold text-zinc-300">256-Bit HS256 JWT</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
              <span>CYBER COMMAND SOC: ACTIVE</span>
              <span>BANGALORE HQ</span>
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
                    ? "Enroll official credentials in Lumina Security Vault"
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
                      Officer Name &amp; Rank <span className="text-red-400">*</span>
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
                      Official Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                        mail
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. officer@ksp.gov.in or officer@gmail.com"
                        className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-zinc-500">
                      Required for security key recovery and verification dispatches.
                    </p>
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
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  {isSignUp ? "Karnataka Police Badge ID" : "Badge ID or Official Email"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                    badge
                  </span>
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => {
                      setBadgeId(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={isSignUp ? "e.g. KSP-4521" : "e.g. KSP-4521 or officer@ksp.gov.in"}
                    className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                    required
                  />
                </div>
                {!isSignUp && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="rememberBadge"
                      checked={rememberBadge}
                      onChange={(e) => setRememberBadge(e.target.checked)}
                      className="size-3.5 rounded border border-white/20 bg-[#090a0f] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                    />
                    <label htmlFor="rememberBadge" className="font-mono text-[11px] text-zinc-400 cursor-pointer select-none">
                      Remember Badge ID on this terminal
                    </label>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                    Security Password Key
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      className="font-mono text-[11px] text-blue-400/90 hover:text-blue-300 transition-colors hover:underline cursor-pointer"
                    >
                      Forgot Key?
                    </button>
                  )}
                </div>
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
                  <span>{isSignUp ? "Enroll Officer Key & Enter" : "Authenticate & Access Console"}</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-150 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSso}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-2.5 px-6 text-xs font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-[0.985] cursor-pointer"
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
              onClick={() => setShowRecoveryModal(true)}
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300 hover:underline cursor-pointer font-mono text-[11px]"
            >
              Trouble authenticating? Reset Security Key
            </button>
          </div>
        </div>
      </div>

      {/* Password Recovery Vault Modal */}
      <PasswordRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        initialBadgeId={badgeId}
        onSuccess={(updatedBadge, newPass) => {
          setBadgeId(updatedBadge);
          setPassword(newPass);
          setErrorMessage(null);
        }}
      />
    </div>
  );
}
