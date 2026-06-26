import { AppConfig } from "../../../config/app.config";

/** Resolve a storage path or relative upload URL to a browser-loadable URL. */
export function resolveStudyAgentMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = AppConfig.STUDY_AGENT_SERVICE_URL.replace(/\/$/, "");
  const normalized = url.replace(/\\/g, "/");
  const marker = "/uploads/";
  const idx = normalized.indexOf(marker);
  if (idx !== -1) return `${base}${normalized.slice(idx)}`;
  if (normalized.startsWith("/app/")) return `${base}${normalized.slice("/app".length)}`;
  return url;
}
