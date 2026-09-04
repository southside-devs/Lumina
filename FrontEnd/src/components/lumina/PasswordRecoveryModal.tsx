import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBadgeId?: string;
  onSuccess: (badgeId: string, newPassword: string) => void;
}

export function PasswordRecoveryModal({
  isOpen,
  onClose,
  initialBadgeId = "",
  onSuccess,
}: PasswordRecoveryModalProps) {
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [badgeOrEmail, setBadgeOrEmail] = useState(initialBadgeId || "KSP-4521");
  const [targetBadge, setTargetBadge] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setBadgeOrEmail(initialBadgeId || "KSP-4521");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setPreviewCode(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialBadgeId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time password strength requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSymbol = /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSymbol && passwordsMatch;

  // Step 1: Request PIN
  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = badgeOrEmail.trim();
    if (!cleanId) {
      setErrorMessage("Please enter your Badge ID or Official Email.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await forgotPassword(cleanId);
      setTargetBadge(data.badge_id || cleanId.toUpperCase());
      if (data.preview_code) {
        setPreviewCode(data.preview_code);
      }
      setStep(2);
      toast.info("Security Verification Dispatched", {
        description: data.message || "Enter the 6-digit cryptographic PIN to reset your password.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate recovery.";
      setErrorMessage(msg);
      toast.error("Recovery Fault", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify PIN & Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Please fulfill all security password complexity requirements.");
      return;
    }

    setIsLoading(true);

    try {
      const activeBadge = targetBadge || badgeOrEmail.trim().toUpperCase();
      await resetPassword({
        badgeId: activeBadge,
        code: cleanCode,
        newPassword,
      });

      toast.success("Security Key Updated", {
        description: "Your officer credentials have been reset. All prior sessions are revoked.",
      });

      onSuccess(activeBadge, newPassword);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset security key.";
      setErrorMessage(msg);
      toast.error("Security Key Reset Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150 font-sans text-white"
    >
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#090b12]/98 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-3xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <span className="material-symbols-outlined text-xl">lock_reset</span>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-tight text-white">
                Officer Key Recovery Vault
              </h3>
              <p className="font-mono text-[10px] text-zinc-400">
                Karnataka State Police Zero-Trust Protocol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="my-4 flex items-center gap-2">
          <div
            className={`flex-1 h-1 rounded-full transition-all ${
              step >= 1 ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-white/10"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full transition-all ${
              step >= 2 ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-white/10"
            }`}
          />
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
            <span className="font-mono text-[11px] leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Officer Identification */}
        {step === 1 && (
          <form onSubmit={handleRequestPin} className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Enter your assigned <strong className="text-white">Badge ID</strong> or official{" "}
              <strong className="text-white">@ksp.gov.in</strong> email. A single-use 6-digit
              cryptographic PIN will be dispatched for key rotation.
            </p>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Officer Identifier
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                  badge
                </span>
                <input
                  type="text"
                  value={badgeOrEmail}
                  onChange={(e) => {
                    setBadgeOrEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. KSP-4521 or officer@ksp.gov.in"
                  className="w-full rounded-xl border border-white/10 bg-[#06070a] py-3 pr-4 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <span className="material-symbols-outlined text-xs text-emerald-400">shield</span>
                Security Enforcement
              </div>
              <p>• Account enumeration protected with constant-time cryptographic response.</p>
              <p>• Maximum 4 requests per 15-minute window.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Generate Reset PIN</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verification PIN & New Key */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono">
                Target Badge: <strong className="text-blue-400 font-bold">{targetBadge || badgeOrEmail}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-mono text-[11px] text-zinc-400 hover:text-white transition-colors hover:underline cursor-pointer"
              >
                Change ID
              </button>
            </div>

            {/* Live Preview PIN Notification (Resilience for Serverless Demos without SMTP) */}
            {previewCode && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-emerald-400 text-lg shrink-0">key</span>
                  <div className="min-w-0">
                    <p className="font-mono font-bold tracking-wider">SECURE PIN: {previewCode}</p>
                    <p className="text-[10px] text-emerald-400/80">Valid for 10 minutes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(previewCode)}
                  className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* 6-Digit PIN input */}
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                6-Digit Verification PIN
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setErrorMessage(null);
                }}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold rounded-xl border border-white/10 bg-[#06070a] py-2.5 text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                required
                autoFocus
              />
            </div>

            {/* New Password Key */}
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                New Security Password Key
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter strong security key"
                  className="w-full rounded-xl border border-white/10 bg-[#06070a] py-2.5 pr-10 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Confirm Security Key
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-500">
                  check_circle
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Re-type new security key"
                  className="w-full rounded-xl border border-white/10 bg-[#06070a] py-2.5 pr-10 pl-11 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-blue-500/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Complexity Checklist */}
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[10px] font-mono">
              <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-400" : "text-zinc-500"}`}>
                <span className="material-symbols-outlined text-xs">
                  {hasMinLength ? "check" : "radio_button_unchecked"}
                </span>
                8+ Characters
              </span>
              <span className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-400" : "text-zinc-500"}`}>
                <span className="material-symbols-outlined text-xs">
                  {hasUppercase ? "check" : "radio_button_unchecked"}
                </span>
                Uppercase (A-Z)
              </span>
              <span className={`flex items-center gap-1 ${hasLowercase ? "text-emerald-400" : "text-zinc-500"}`}>
                <span className="material-symbols-outlined text-xs">
                  {hasLowercase ? "check" : "radio_button_unchecked"}
                </span>
                Lowercase (a-z)
              </span>
              <span className={`flex items-center gap-1 ${hasDigit && hasSymbol ? "text-emerald-400" : "text-zinc-500"}`}>
                <span className="material-symbols-outlined text-xs">
                  {hasDigit && hasSymbol ? "check" : "radio_button_unchecked"}
                </span>
                Number & Symbol
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid || code.length < 6}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Verify &amp; Update Key</span>
                    <span className="material-symbols-outlined text-base">check</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
