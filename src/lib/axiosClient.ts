// src/lib/axiosClient.ts
/**
 * Axios instance pre-configured for the Identity Service.
 * - Attaches Bearer access token from in-memory tokenStore on every request.
 * - On 401 (non-auth endpoints), silently refreshes once then retries.
 * - If refresh fails, clears auth and redirects to /auth.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { AppConfig } from "../config/app.config";
import {
  forceLoginRedirect,
  isAuthEndpointUrl,
  refreshAccessTokenSingleFlight,
} from "./authSession";
import { getAccessToken } from "./tokenStore";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const axiosClient = axios.create({
  baseURL: AppConfig.IDENTITY_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Request interceptor — attach access token ─────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — silent refresh on 401, then retry once ─────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    // Login / refresh / logout failures must not clear the session or loop.
    if (isAuthEndpointUrl(original.url)) {
      return Promise.reject(error);
    }

    if (original._retry) {
      forceLoginRedirect();
      return Promise.reject(error);
    }

    original._retry = true;
    const newToken = await refreshAccessTokenSingleFlight();
    if (!newToken) {
      forceLoginRedirect();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return axiosClient(original);
  }
);

export default axiosClient;
