/**
 * Axios instance for the Study Agent Service (study material, quizzes, reference materials).
 */

import axios from "axios";
import { AppConfig } from "../config/app.config";

const studyAgentClient = axios.create({
  baseURL: AppConfig.STUDY_AGENT_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000,
});

studyAgentClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

studyAgentClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default studyAgentClient;
