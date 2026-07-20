export type VideoAnalyticsEvent =
  | "watch_in_app"
  | "open_external_fallback"
  | "embed_error";

export type VideoAnalyticsPayload = {
  surface: "trainee" | "mentor";
  nodeId?: string;
  mediaId?: string;
  videoId?: string;
  url?: string;
  reason?: string;
};

/** Thin analytics hook for in-app YouTube playback; swap provider later without changing call sites. */
export function trackVideoEvent(
  event: VideoAnalyticsEvent,
  payload: VideoAnalyticsPayload,
): void {
  if (import.meta.env.DEV) {
    console.debug("[video-analytics]", event, payload);
  }
  // Production: no-op until a provider (PostHog, GA, etc.) is wired in.
}
