// src/features/auth/services/authService.ts
/**
 * Auth API service — all calls against the Identity Service /auth/* endpoints.
 * Uses the shared axiosClient (which does NOT attach access token for these public endpoints).
 * Auth endpoints intentionally use a raw axios call or the shared client — either is fine
 * since login/refresh do not need a Bearer token in the header.
 */

import axiosClient from "../../../lib/axiosClient";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
} from "../types/auth.types";

export const authService = {
  /**
   * POST /auth/login
   * Authenticates any role (itadmin / mentor / trainee) by email + password.
   * Returns access_token (60 min) and refresh_token (7 days).
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginResponse>("/auth/login", payload);
    return response.data;
  },

  /**
   * POST /auth/refresh
   * Exchanges a valid refresh token for a new access token.
   */
  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const response = await axiosClient.post<RefreshResponse>("/auth/refresh", payload);
    return response.data;
  },

  /**
   * POST /auth/logout
   * Invalidates the refresh token by blocklisting its jti.
   */
  async logout(payload: LogoutRequest): Promise<void> {
    await axiosClient.post("/auth/logout", payload);
  },
};
