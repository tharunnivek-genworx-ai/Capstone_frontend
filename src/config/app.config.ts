/**
 * App Config
 * Global application configuration sourced from environment variables.
 */

export const AppConfig = {
  IDENTITY_SERVICE_URL:
    import.meta.env.VITE_IDENTITY_SERVICE_URL || "http://localhost:8000",
} as const;
