/**
 * Shared silent-refresh helper (single-flight).
 *
 * Used by AuthProvider bootstrap and by axios 401 interceptors so concurrent
 * expiry during polling / quiz / generation only triggers one /auth/refresh.
 * Uses a bare axios call (no interceptors) to avoid recursion.
 */

import axios from "axios";
import { AppConfig } from "../config/app.config";
import {
  clearAuth,
  getRefreshToken,
  setAccessToken,
  setUserId,
  setUserRole,
} from "./tokenStore";

interface RefreshResponseBody {
  access_token: string;
}

let refreshInFlight: Promise<string | null> | null = null;

function applyAccessTokenClaims(accessToken: string): void {
  try {
    const [, payloadPart] = accessToken.split(".");
    if (!payloadPart) return;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as {
      role?: string;
      sub?: string;
    };
    if (payload.role) setUserRole(payload.role);
    if (payload.sub) setUserId(payload.sub);
  } catch {
    // Claims are UI hints only — ignore decode failures
  }
}

/**
 * Exchange the tab's refresh token for a new in-memory access token.
 * Concurrent callers share one in-flight request.
 * Returns the new access token, or null if refresh is impossible / failed.
 */
export function refreshAccessTokenSingleFlight(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const { data } = await axios.post<RefreshResponseBody>(
        `${AppConfig.IDENTITY_SERVICE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );
      if (!data?.access_token) return null;
      setAccessToken(data.access_token);
      applyAccessTokenClaims(data.access_token);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** True when the request is an Identity /auth/* call (never auto-refresh these). */
export function isAuthEndpointUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\/auth\/(login|refresh|logout)(?:\?|$)/.test(url);
}

/** Force login after refresh is exhausted. */
export function forceLoginRedirect(): void {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
}
