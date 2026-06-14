// src/features/auth/context/AuthContext.tsx
/**
 * Auth context provider for the Identity Service.
 *
 * Storage strategy (both in localStorage):
 *   access_token  — JWT (60 min), attached by axiosClient interceptor
 *   refresh_token — JWT (7 days), sent manually to /auth/refresh and /auth/logout
 *   user_role     — "itadmin" | "mentor" | "trainee"
 *   user_id       — UUID string (sub claim from JWT)
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

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem("access_token")
  );
  const [role, setRole] = useState<UserRole | null>(
    () => localStorage.getItem("user_role") as UserRole | null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── On mount: if access token is expired but refresh token is valid, refresh ──
  useEffect(() => {
    const tryRefresh = async () => {
      const storedAccess = localStorage.getItem("access_token");
      const storedRefresh = localStorage.getItem("refresh_token");

      if (!storedRefresh) return;
      if (storedAccess && !isTokenExpired(storedAccess)) return; // still valid

      if (isTokenExpired(storedRefresh)) {
        // Refresh token also expired — force logout
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_id");
        setAccessToken(null);
        setRole(null);
        return;
      }

      try {
        const result = await authService.refresh({
          refresh_token: storedRefresh,
        });
        localStorage.setItem("access_token", result.access_token);
        setAccessToken(result.access_token);
        const payload = decodeJwt(result.access_token);
        if (payload) {
          setRole(payload.role);
          localStorage.setItem("user_role", payload.role);
          localStorage.setItem("user_id", payload.sub);
        }
      } catch {
        // Refresh failed — clear everything
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_id");
        setAccessToken(null);
        setRole(null);
      }
    };

    tryRefresh();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });

      // Persist both tokens and decoded claims
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);

      const payload = decodeJwt(response.access_token);
      const userRole = payload?.role ?? null;
      const userSub = payload?.sub ?? null;

      if (userRole) localStorage.setItem("user_role", userRole);
      if (userSub) localStorage.setItem("user_id", userSub);

      setAccessToken(response.access_token);
      setRole(userRole);
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
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await authService.logout({ refresh_token: refreshToken });
      } catch {
        // Best-effort — clear client state regardless
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    setAccessToken(null);
    setRole(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      isLoading,
      error,
      isLoggedIn: !!accessToken,
      login,
      logout,
      clearError,
    }),
    [accessToken, role, isLoading, error, login, logout, clearError]
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
