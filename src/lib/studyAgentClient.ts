/**
 * Axios instance for the Study Agent Service (study material, quizzes, reference materials).
 * On 401, silently refreshes the access token once (shared with axiosClient) then retries,
 * so generation / QC / quiz polling is not interrupted by access-token TTL alone.
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

const studyAgentClient = axios.create({
  baseURL: AppConfig.STUDY_AGENT_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000,
});

studyAgentClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData must not use application/json — browser must set multipart boundary.
    if (config.data instanceof FormData) {
      config.headers.setContentType(false);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

studyAgentClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

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
    return studyAgentClient(original);
  }
);

export default studyAgentClient;
