import { describe, expect, it } from "vitest";

import {
  extractYouTubeVideoId,
  isYouTubeUrl,
  toEmbedUrl,
  toWatchUrl,
} from "./youtubeUrl";

const VIDEO_ID = "dQw4w9WgXcQ";

describe("isYouTubeUrl", () => {
  it("accepts common YouTube watch, short, embed, and youtu.be URLs", () => {
    expect(isYouTubeUrl(`https://www.youtube.com/watch?v=${VIDEO_ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://youtube.com/watch?v=${VIDEO_ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://m.youtube.com/watch?v=${VIDEO_ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://music.youtube.com/watch?v=${VIDEO_ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://youtu.be/${VIDEO_ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://www.youtube.com/embed/${VIDEO_ID}`)).toBe(true);
    expect(isYouTubeUrl(`https://www.youtube.com/shorts/${VIDEO_ID}`)).toBe(true);
  });

  it("rejects empty, malformed, and non-YouTube URLs", () => {
    expect(isYouTubeUrl("")).toBe(false);
    expect(isYouTubeUrl("   ")).toBe(false);
    expect(isYouTubeUrl("not-a-url")).toBe(false);
    expect(isYouTubeUrl("javascript:alert(1)")).toBe(false);
    expect(isYouTubeUrl("ftp://youtube.com/watch?v=abc")).toBe(false);
    expect(isYouTubeUrl("https://vimeo.com/123456789")).toBe(false);
    expect(isYouTubeUrl("https://notyoutube.com/watch?v=abc")).toBe(false);
  });
});

describe("extractYouTubeVideoId", () => {
  it("extracts IDs from watch URLs, including extra query params", () => {
    expect(extractYouTubeVideoId(`https://www.youtube.com/watch?v=${VIDEO_ID}`)).toBe(VIDEO_ID);
    expect(
      extractYouTubeVideoId(
        `https://www.youtube.com/watch?v=${VIDEO_ID}&t=90&si=abc&list=PL123`,
      ),
    ).toBe(VIDEO_ID);
    expect(extractYouTubeVideoId(`https://youtube.com/watch?v=${VIDEO_ID}&start=45`)).toBe(
      VIDEO_ID,
    );
  });

  it("extracts IDs from youtu.be, embed, and shorts URLs", () => {
    expect(extractYouTubeVideoId(`https://youtu.be/${VIDEO_ID}`)).toBe(VIDEO_ID);
    expect(extractYouTubeVideoId(`https://youtu.be/${VIDEO_ID}?t=30`)).toBe(VIDEO_ID);
    expect(extractYouTubeVideoId(`https://www.youtube.com/embed/${VIDEO_ID}`)).toBe(VIDEO_ID);
    expect(extractYouTubeVideoId(`https://www.youtube.com/shorts/${VIDEO_ID}`)).toBe(VIDEO_ID);
    expect(extractYouTubeVideoId(`https://www.youtube.com/live/${VIDEO_ID}`)).toBe(VIDEO_ID);
  });

  it("returns null for malformed or non-YouTube URLs", () => {
    expect(extractYouTubeVideoId("")).toBeNull();
    expect(extractYouTubeVideoId("javascript:alert(1)")).toBeNull();
    expect(extractYouTubeVideoId("https://www.youtube.com/watch")).toBeNull();
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(extractYouTubeVideoId("https://vimeo.com/123456789")).toBeNull();
    expect(extractYouTubeVideoId(`https://example.com/watch?v=${VIDEO_ID}`)).toBeNull();
  });
});

describe("toEmbedUrl", () => {
  it("normalizes a valid video ID to an embed URL", () => {
    expect(toEmbedUrl(VIDEO_ID)).toBe(`https://www.youtube.com/embed/${VIDEO_ID}`);
  });

  it("appends a start offset when provided", () => {
    expect(toEmbedUrl(VIDEO_ID, { startSeconds: 90.9 })).toBe(
      `https://www.youtube.com/embed/${VIDEO_ID}?start=90`,
    );
  });

  it("returns null for invalid video IDs", () => {
    expect(toEmbedUrl("")).toBeNull();
    expect(toEmbedUrl("too-short")).toBeNull();
  });
});

describe("toWatchUrl", () => {
  it("normalizes a valid video ID to a watch URL", () => {
    expect(toWatchUrl(VIDEO_ID)).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
  });

  it("returns null for invalid video IDs", () => {
    expect(toWatchUrl("")).toBeNull();
    expect(toWatchUrl("not-valid-id")).toBeNull();
  });
});
