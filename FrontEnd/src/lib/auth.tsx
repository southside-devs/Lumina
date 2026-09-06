import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { getApiBase } from "./api";

export interface OfficerUser {
  id: string;
  badgeId: string;
  name: string;
  rank: string;
  stationUnit: string;
  role: "Admin" | "SHO" | "SCRB_Analyst" | "Officer" | string;
  email: string;
}

export interface RegisterPayload {
  badgeId: string;
  password: string;
  officerName: string;
  stationUnit?: string;
  rank?: string;
  email: string;
}

interface AuthContextType {
  user: OfficerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (badgeId: string, password: string) => Promise<OfficerUser>;
  register: (payload: RegisterPayload) => Promise<OfficerUser>;
  ssoLogin: () => Promise<OfficerUser>;
  logout: () => void;
  forgotPassword: (badgeOrEmail: string) => Promise<{ message: string; badge_id?: string; masked_email?: string; expires_in_seconds?: number }>;
  resetPassword: (payload: { badgeId: string; code: string; newPassword: string }) => Promise<OfficerUser>;
}

const TOKEN_KEY = "lumina_auth_token";
const USER_KEY = "lumina_auth_user";
const ENROLLED_OFFICERS_KEY = "lumina_enrolled_officers";

export interface EnrolledOfficerProfile {
  badgeId: string;
  password?: string;
  officerName: string;
  stationUnit: string;
  rank: string;
  email: string;
}

export function getStoredEnrolledOfficers(): Record<string, EnrolledOfficerProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ENROLLED_OFFICERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredEnrolledOfficer(profile: EnrolledOfficerProfile): void {
  if (typeof window === "undefined") return;
  try {
    const store = getStoredEnrolledOfficers();
    const rawBadge = profile.badgeId.trim();
    const cleanBadge = rawBadge.toUpperCase();
    const lowerBadge = rawBadge.toLowerCase();
    const normBadge = cleanBadge.replace(/[\s\-_]+/g, "");

    store[cleanBadge] = profile;
    store[lowerBadge] = profile;
    store[normBadge] = profile;
    store[rawBadge] = profile;

    if (profile.email) {
      const rawEmail = profile.email.trim();
      store[rawEmail.toLowerCase()] = profile;
      store[rawEmail.toUpperCase()] = profile;
      store[rawEmail] = profile;
    }
    localStorage.setItem(ENROLLED_OFFICERS_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Could not save enrolled officer to localStorage:", e);
  }
}

// Pre-seeded fallback officer (Insp. Rajesh Kumar) for offline presentation resilience
export const DEFAULT_OFFICER: OfficerUser = {
  id: "1",
  badgeId: "KSP-4521",
  name: "Inspector Rajesh Kumar",
  rank: "Police Inspector",
  stationUnit: "Cyber & Strategic Command HQ, Bengaluru",
  role: "Admin",
  email: "r.kumar@ksp.gov.in",
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredAuthUser(): OfficerUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OfficerUser | null>(() => getStoredAuthUser());
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate active session on initial mount
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const activeToken = getStoredAuthToken();
      if (!activeToken) {
        setIsLoading(false);
        return;
      }

      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "X-Lumina-Token": activeToken,
            "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            const officer = json.data;
            const validUser: OfficerUser = {
              id: String(officer.id),
              badgeId: officer.badge_id,
              name: officer.name,
              rank: officer.rank,
              stationUnit: officer.station_unit,
              role: officer.role,
              email: officer.email,
            };
            setUser(validUser);
            localStorage.setItem(USER_KEY, JSON.stringify(validUser));
          }
        } else if (res.status === 401 || res.status === 403) {
          if (isMounted) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn("Session verification warning (operating in resilient mode):", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (badgeId: string, password: string): Promise<OfficerUser> => {
    const apiBase = getApiBase();
    const rawInput = badgeId.trim();
    const cleanId = rawInput.toUpperCase();
    const lowerId = rawInput.toLowerCase();
    const normId = cleanId.replace(/[\s\-_]+/g, "");
    const enrolledStore = getStoredEnrolledOfficers();
    const localProfile =
      enrolledStore[cleanId] ||
      enrolledStore[lowerId] ||
      enrolledStore[normId] ||
      enrolledStore[rawInput];

    // Pass enrollment sync metadata to auto-heal cold/recycled cloud serverless containers
    const reqBody: any = { badge_id: badgeId, password };
    if (localProfile && localProfile.password === password) {
      reqBody.enrollment_sync = {
        badge_id: localProfile.badgeId,
        officer_name: localProfile.officerName,
        station_unit: localProfile.stationUnit,
        rank: localProfile.rank,
        email: localProfile.email,
      };
    }

    let res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
      body: JSON.stringify(reqBody),
    });

    // If 401 and we have matching locally enrolled credentials, attempt active self-healing re-sync
    if (res.status === 401 && localProfile && localProfile.password === password) {
      try {
        const syncRes = await fetch(`${apiBase}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
          },
          body: JSON.stringify({
            badge_id: localProfile.badgeId,
            password: localProfile.password,
            officer_name: localProfile.officerName,
            station_unit: localProfile.stationUnit,
            rank: localProfile.rank,
            email: localProfile.email,
          }),
        });
        if (syncRes.ok) {
          // Retry login immediately against refreshed worker
          res = await fetch(`${apiBase}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
            },
            body: JSON.stringify({ badge_id: badgeId, password }),
          });
        }
      } catch (syncErr) {
        console.warn("Self-healing enrollment sync fallback:", syncErr);
      }
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Non-JSON response (e.g. 502/504 Bad Gateway / Proxy connection refused)
    }

    if (!res.ok) {
      if (!json) {
        if (res.status === 502 || res.status === 504 || res.status === 500) {
          throw new Error("Lumina API backend is offline. Ensure Python server is running on port 3000.");
        }
        throw new Error("Authentication failed. Unable to communicate with auth service.");
      }
      const msg = json?.message || json?.error || "Authentication failed. Invalid Badge ID or Security Key.";
      throw new Error(msg);
    }

    const { token: sessionToken, officer } = json.data;
    const authenticatedUser: OfficerUser = {
      id: String(officer.id),
      badgeId: officer.badge_id,
      name: officer.name,
      rank: officer.rank,
      stationUnit: officer.station_unit,
      role: officer.role,
      email: officer.email,
    };

    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setToken(sessionToken);
    setUser(authenticatedUser);

    // Also update/save enrolled officer credentials on this terminal
    saveStoredEnrolledOfficer({
      badgeId: officer.badge_id,
      password: password,
      officerName: officer.name,
      stationUnit: officer.station_unit,
      rank: officer.rank,
      email: officer.email,
    });

    return authenticatedUser;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<OfficerUser> => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
      body: JSON.stringify({
        badge_id: payload.badgeId,
        password: payload.password,
        officer_name: payload.officerName,
        station_unit: payload.stationUnit,
        rank: payload.rank,
        email: payload.email,
      }),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Non-JSON response (e.g. 502/504 Bad Gateway / Proxy connection refused)
    }

    if (!res.ok) {
      if (!json) {
        if (res.status === 502 || res.status === 504 || res.status === 500) {
          throw new Error("Lumina API backend is offline. Ensure Python server is running on port 3000.");
        }
        throw new Error("Registration failed. Unable to communicate with auth service.");
      }
      const msg = json?.message || json?.error || "Registration failed. Check your officer credentials.";
      throw new Error(msg);
    }

    const { token: sessionToken, officer } = json.data;
    const authenticatedUser: OfficerUser = {
      id: String(officer.id),
      badgeId: officer.badge_id,
      name: officer.name,
      rank: officer.rank,
      stationUnit: officer.station_unit,
      role: officer.role,
      email: officer.email,
    };

    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setToken(sessionToken);
    setUser(authenticatedUser);

    // Persist enrolled officer credentials to local terminal store
    saveStoredEnrolledOfficer({
      badgeId: payload.badgeId,
      password: payload.password,
      officerName: payload.officerName,
      stationUnit: payload.stationUnit || "Karnataka State Police",
      rank: payload.rank || "Police Officer",
      email: payload.email,
    });

    return authenticatedUser;
  }, []);

  const ssoLogin = useCallback(async (): Promise<OfficerUser> => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Non-JSON
    }

    if (!res.ok) {
      if (!json && (res.status === 502 || res.status === 504 || res.status === 500)) {
        throw new Error("Lumina API backend is offline. Ensure Python server is running on port 3000.");
      }
      throw new Error(json?.message || "SSO Authentication Gateway unreachable.");
    }

    const { token: sessionToken, officer } = json.data;
    const authenticatedUser: OfficerUser = {
      id: String(officer.id),
      badgeId: officer.badge_id,
      name: officer.name,
      rank: officer.rank,
      stationUnit: officer.station_unit,
      role: officer.role,
      email: officer.email,
    };

    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setToken(sessionToken);
    setUser(authenticatedUser);

    return authenticatedUser;
  }, []);

  const logout = useCallback(() => {
    try {
      const apiBase = getApiBase();
      const currentToken = getStoredAuthToken();
      if (currentToken) {
        fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          headers: {
            "X-Lumina-Token": currentToken,
            "X-Auth-Token": currentToken,
          },
        }).catch(() => {});
      }
    } catch {
      // Ignore network errors on logout
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    toast.info("Session Closed", {
      description: "Officer credentials cleared. Command center locked.",
    });
  }, []);

  const forgotPassword = useCallback(async (badgeOrEmail: string) => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
      body: JSON.stringify({ badge_id: badgeOrEmail }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || "Failed to initiate security key reset.";
      throw new Error(msg);
    }
    return json?.data || {};
  }, []);

  const resetPassword = useCallback(async (payload: { badgeId: string; code: string; newPassword: string }): Promise<OfficerUser> => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
      body: JSON.stringify({
        badge_id: payload.badgeId,
        code: payload.code,
        new_password: payload.newPassword,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || "Failed to reset security key.";
      throw new Error(msg);
    }

    const { token: sessionToken, officer } = json.data;
    const authenticatedUser: OfficerUser = {
      id: String(officer.id),
      badgeId: officer.badge_id,
      name: officer.name,
      rank: officer.rank,
      stationUnit: officer.station_unit,
      role: officer.role,
      email: officer.email,
    };

    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setToken(sessionToken);
    setUser(authenticatedUser);

    return authenticatedUser;
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    ssoLogin,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Route Guard Component
 * Wraps protected views and root outlet.
 * If user is unauthenticated, immediately redirects to /login with redirect intent.
 * Permits unauthenticated access ONLY on /login.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage =
    location.pathname === "/login" ||
    location.pathname.startsWith("/login") ||
    (typeof window !== "undefined" &&
      (window.location.hash.startsWith("#/login") || window.location.hash.includes("/login")));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      const currentPath = location.pathname || "/";
      try {
        navigate({
          to: "/login",
          search: currentPath !== "/" && currentPath !== "/login" ? { redirect: currentPath } : undefined,
        });
      } catch {
        // Fallback
      }
      if (typeof window !== "undefined" && !window.location.hash.includes("/login")) {
        window.location.hash = "#/login";
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, navigate, location.pathname]);

  // Permit login page for unauthenticated users
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07080b] p-4 text-white font-sans">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.35)] animate-pulse">
          <span className="material-symbols-outlined text-2xl text-blue-400">shield_lock</span>
        </div>
        <div className="mt-4 text-center">
          <h2 className="font-display text-sm font-bold tracking-wider uppercase text-white">
            Verifying Officer Security Credentials...
          </h2>
          <p className="mt-1 font-mono text-[11px] text-zinc-400">
            Connecting to Karnataka State Police Key Vault
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

