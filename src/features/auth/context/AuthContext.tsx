// src/features/auth/context/AuthContext.tsx
/**
 * Auth context provider for the Identity Service.
 *
 * Storage strategy (see src/lib/tokenStore.ts):
 *   access_token  — in-memory only (never persisted); restored via silent refresh
 *                   on mount and on 401 via authSession single-flight.
 *   refresh_token — sessionStorage (7 days), sent manually to /auth/refresh and
 *                   /auth/logout; cleared on tab close.
 *   user_role     — sessionStorage ("itadmin" | "mentor" | "trainee"), UI hint only
 *   user_id       — sessionStorage (sub claim from JWT), UI hint only
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import {
  clearMentorDepartment,
  normalizeMentorDepartment,
  storeMentorDepartment,
} from "../../spaces/utils/mentorDepartment";
import { refreshAccessTokenSingleFlight } from "../../../lib/authSession";
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  getUserRole,
  setAccessToken as storeAccessToken,
  setRefreshToken as storeRefreshToken,
  setUserId as storeUserId,
  setUserRole as storeUserRole,
} from "../../../lib/tokenStore";
import type { TokenPayload, UserRole } from "../types/auth.types";

// ─── JWT helpers ──────────────────────────────────────────────────────────────
const decodeJwt = (token: string): TokenPayload | null => {
  try {
    const [, payloadPart] = token.split(".");
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return Date.now() / 1000 > payload.exp;
};

/**
 * One bootstrap refresh per page load. StrictMode remounts both await this
 * promise so the surviving mount still applies access token + role to state.
 */
let bootstrapPromise: Promise<string | null> | null = null;

function ensureBootstrapRefresh(): Promise<string | null> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const storedRefresh = getRefreshToken();
    if (!storedRefresh) return null;

    if (isTokenExpired(storedRefresh)) {
      clearAuth();
      clearMentorDepartment();
      return null;
    }

    const newAccess = await refreshAccessTokenSingleFlight();
    if (!newAccess) {
      clearAuth();
      clearMentorDepartment();
      return null;
    }
    return newAccess;
  })();

  return bootstrapPromise;
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  role: UserRole | null;
  isLoading: boolean;
  /** True until the mount-time silent refresh attempt settles. */
  isBootstrapping: boolean;
  error: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<UserRole | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Access token lives in memory only — null on every reload until silent refresh.
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getAccessToken()
  );
  const [role, setRole] = useState<UserRole | null>(
    () => getUserRole() as UserRole | null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Gate initial renders until the mount refresh settles; only bootstrap if a
  // refresh token exists in this tab's session.
  const [isBootstrapping, setIsBootstrapping] = useState(
    () => !!getRefreshToken()
  );

  // ── On mount: access is never persisted, so always try to refresh when a ──
  // ── refresh token exists in this tab. Shared promise + single-flight     ──
  // ── refresh survive StrictMode remount and coalesce with 401 interceptors. ──
  useEffect(() => {
    let cancelled = false;

    const tryRefresh = async () => {
      if (!getRefreshToken()) {
        setIsBootstrapping(false);
        return;
      }

      const newAccess = await ensureBootstrapRefresh();
      if (cancelled) return;

      if (newAccess) {
        setAccessToken(newAccess);
        const payload = decodeJwt(newAccess);
        if (payload) {
          setRole(payload.role);
          storeUserRole(payload.role);
          storeUserId(payload.sub);
        }
      } else {
        setAccessToken(null);
        setRole(null);
      }
      setIsBootstrapping(false);
    };

    void tryRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<UserRole | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login({ email, password });

        // Access token → memory; refresh token → sessionStorage.
        storeAccessToken(response.access_token);
        storeRefreshToken(response.refresh_token);

        const payload = decodeJwt(response.access_token);
        const userRole = payload?.role ?? null;
        const userSub = payload?.sub ?? null;

        if (userRole) storeUserRole(userRole);
        if (userSub) storeUserId(userSub);

        const mentorDept = normalizeMentorDepartment(response);
        if (userRole === "mentor" && mentorDept) {
          storeMentorDepartment(mentorDept);
        } else {
          clearMentorDepartment();
        }

        setAccessToken(response.access_token);
        setRole(userRole);
        return userRole;
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ||
          (err as { message?: string })?.message ||
          "Login failed. Please check your credentials.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout({ refresh_token: refreshToken });
      } catch {
        // Best-effort — clear client state regardless
      }
    }
    clearAuth();
    clearMentorDepartment();
    setAccessToken(null);
    setRole(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      isLoading,
      isBootstrapping,
      error,
      isLoggedIn: !!accessToken,
      login,
      logout,
      clearError,
    }),
    [
      accessToken,
      role,
      isLoading,
      isBootstrapping,
      error,
      login,
      logout,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
};
