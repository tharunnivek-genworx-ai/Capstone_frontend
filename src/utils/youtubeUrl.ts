/** YouTube video IDs are 11 URL-safe characters. */
const VIDEO_ID_PATTERN = /^[\w-]{11}$/;

const YOUTU_BE_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

function isYouTubeHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (YOUTU_BE_HOSTS.has(host)) {
    return true;
  }
  return host === "youtube.com" || host.endsWith(".youtube.com");
}

function normalizeVideoId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return VIDEO_ID_PATTERN.test(trimmed) ? trimmed : null;
}

function parseSafeHttpUrl(url: string): URL | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function extractIdFromPath(pathname: string): string | null {
  const [section, maybeId] = pathname.split("/").filter(Boolean);
  if (!section || !maybeId) {
    return null;
  }

  const route = section.toLowerCase();
  if (route === "embed" || route === "shorts" || route === "live" || route === "v") {
    return normalizeVideoId(maybeId);
  }

  return null;
}

export function isYouTubeUrl(url: string): boolean {
  const parsed = parseSafeHttpUrl(url);
  if (!parsed) {
    return false;
  }
  return isYouTubeHostname(parsed.hostname);
}

export function extractYouTubeVideoId(url: string): string | null {
  const parsed = parseSafeHttpUrl(url);
  if (!parsed || !isYouTubeHostname(parsed.hostname)) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (YOUTU_BE_HOSTS.has(host)) {
    const [videoId] = parsed.pathname.split("/").filter(Boolean);
    return normalizeVideoId(videoId);
  }

  const pathId = extractIdFromPath(parsed.pathname);
  if (pathId) {
    return pathId;
  }

  if (parsed.pathname === "/watch" || parsed.pathname.startsWith("/watch/")) {
    return normalizeVideoId(parsed.searchParams.get("v"));
  }

  return null;
}

export type YouTubeEmbedUrlOptions = {
  startSeconds?: number;
};

export function toEmbedUrl(videoId: string, options?: YouTubeEmbedUrlOptions): string | null {
  const id = normalizeVideoId(videoId);
  if (!id) {
    return null;
  }

  const base = `https://www.youtube.com/embed/${id}`;
  const startSeconds = options?.startSeconds;
  if (startSeconds != null && Number.isFinite(startSeconds) && startSeconds > 0) {
    return `${base}?start=${Math.floor(startSeconds)}`;
  }

  return base;
}

export function toWatchUrl(videoId: string): string | null {
  const id = normalizeVideoId(videoId);
  if (!id) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${id}`;
}
