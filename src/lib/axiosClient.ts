// src/lib/axiosClient.ts
/**
 * Axios instance pre-configured for the Identity Service.
 * - Attaches Bearer access token from localStorage on every request.
 * - On 401, clears tokens and redirects to /auth.
 */

import axios from "axios";
import { AppConfig } from "../config/app.config";

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
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 ────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
