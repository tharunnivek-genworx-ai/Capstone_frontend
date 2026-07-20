import { afterEach, describe, expect, it, vi } from "vitest";

import { trackVideoEvent } from "./videoAnalytics";

describe("trackVideoEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs structured payloads in development", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    trackVideoEvent("watch_in_app", {
      surface: "trainee",
      nodeId: "node-1",
      mediaId: "media-1",
      videoId: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    expect(debugSpy).toHaveBeenCalledWith("[video-analytics]", "watch_in_app", {
      surface: "trainee",
      nodeId: "node-1",
      mediaId: "media-1",
      videoId: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("accepts embed_error and fallback reasons", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    trackVideoEvent("embed_error", {
      surface: "mentor",
      videoId: "abc12345678",
      reason: "load_timeout",
    });

    trackVideoEvent("open_external_fallback", {
      surface: "mentor",
      videoId: "abc12345678",
      reason: "embed_error",
    });

    expect(debugSpy).toHaveBeenCalledTimes(2);
    expect(debugSpy.mock.calls[0]?.[1]).toBe("embed_error");
    expect(debugSpy.mock.calls[1]?.[1]).toBe("open_external_fallback");
  });

  it("is a no-op in production", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    trackVideoEvent("watch_in_app", { surface: "trainee", videoId: "dQw4w9WgXcQ" });

    expect(debugSpy).not.toHaveBeenCalled();
  });
});
