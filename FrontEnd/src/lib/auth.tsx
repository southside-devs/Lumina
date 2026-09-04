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
  email?: string;
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
}

const TOKEN_KEY = "lumina_auth_token";
const USER_KEY = "lumina_auth_user";

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
      const storedToken = getStoredAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: {
            "X-Lumina-Token": storedToken,
            "X-Auth-Token": storedToken,
            "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
          },
        });

        if (res.ok) {
          const json = await res.json();
          const officerData = json?.data?.officer;
          if (officerData && isMounted) {
            const mappedUser: OfficerUser = {
              id: String(officerData.id),
              badgeId: officerData.badge_id || officerData.badgeId,
              name: officerData.name,
              rank: officerData.rank,
              stationUnit: officerData.station_unit || officerData.stationUnit,
              role: officerData.role,
              email: officerData.email,
            };
            setUser(mappedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
          }
        } else if (res.status === 401) {
          // Token expired or invalid
          if (isMounted) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        // Network offline fallback: keep cached user if present
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
    const res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
      body: JSON.stringify({ badge_id: badgeId, password }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || "Authentication failed. Invalid Badge ID or Security Key.";
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

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || "Registration failed. Check your officer credentials.";
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

  const ssoLogin = useCallback(async (): Promise<OfficerUser> => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": "lumina-demo-ksp-2026",
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
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

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    ssoLogin,
    logout,
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

  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      const currentPath = location.pathname || "/";
      navigate({
        to: "/login",
        search: currentPath !== "/" && currentPath !== "/login" ? { redirect: currentPath } : undefined,
      });
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

