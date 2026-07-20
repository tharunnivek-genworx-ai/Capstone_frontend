import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import ModalPortal from "./ModalPortal";
import { toEmbedUrl, toWatchUrl } from "../utils/youtubeUrl";
import { trackVideoEvent } from "../utils/videoAnalytics";

const EMBED_LOAD_TIMEOUT_MS = 15_000;

export type YoutubePlayerSurface = "trainee" | "mentor";

export interface YoutubePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
  watchUrl: string;
  surface: YoutubePlayerSurface;
  mediaId?: string;
  nodeId?: string;
}

type PlayerState = "loading" | "ready" | "error";

function parseStartSeconds(url: string): number | undefined {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("t") ?? parsed.searchParams.get("start");
    if (!raw) {
      return undefined;
    }

    if (/^\d+$/.test(raw)) {
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? value : undefined;
    }

    const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
    if (!match) {
      return undefined;
    }

    const [, hours, minutes, seconds] = match;
    const total =
      (hours ? Number(hours) : 0) * 3600 +
      (minutes ? Number(minutes) : 0) * 60 +
      (seconds ? Number(seconds) : 0);
    return total > 0 ? total : undefined;
  } catch {
    return undefined;
  }
}

const YoutubePlayerModal: React.FC<YoutubePlayerModalProps> = ({
  isOpen,
  onClose,
  videoId,
  title,
  watchUrl,
  surface,
  mediaId,
  nodeId,
}) => {
  const titleId = useId();
  const errorDescriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasTrackedWatchRef = useRef(false);
  const [playerState, setPlayerState] = useState<PlayerState>("loading");

  const analyticsBase = useMemo(
    () => ({
      surface,
      nodeId,
      mediaId,
      videoId,
      url: watchUrl,
    }),
    [surface, nodeId, mediaId, videoId, watchUrl],
  );

  const embedUrl = useMemo(
    () => toEmbedUrl(videoId, { startSeconds: parseStartSeconds(watchUrl) }),
    [videoId, watchUrl],
  );
  const externalWatchUrl = useMemo(() => {
    const trimmed = watchUrl.trim();
    if (trimmed) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return trimmed;
        }
      } catch {
        // Fall back to canonical watch URL below.
      }
    }
    return toWatchUrl(videoId) ?? "";
  }, [videoId, watchUrl]);

  const displayTitle = title?.trim() || "YouTube video";

  const reportEmbedError = useCallback(
    (reason: string) => {
      setPlayerState("error");
      trackVideoEvent("embed_error", { ...analyticsBase, reason });
    },
    [analyticsBase],
  );

  const handleOpenExternal = useCallback(() => {
    trackVideoEvent("open_external_fallback", {
      ...analyticsBase,
      reason: playerState === "error" ? "embed_error" : "user_choice",
    });
    if (!externalWatchUrl) {
      toast.error("Unable to open this video externally.");
      return;
    }
    const opened = window.open(externalWatchUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      toast.error("Your browser blocked the new tab. Allow popups to continue.");
    }
  }, [analyticsBase, externalWatchUrl, playerState]);

  const handleIframeLoad = useCallback(() => {
    setPlayerState("ready");
  }, []);

  const handleIframeError = useCallback(() => {
    reportEmbedError("iframe_error");
  }, [reportEmbedError]);

  useEffect(() => {
    if (!isOpen) {
      setPlayerState("loading");
      hasTrackedWatchRef.current = false;
      return;
    }

    if (!embedUrl) {
      reportEmbedError("invalid_embed_url");
      return;
    }

    if (!hasTrackedWatchRef.current) {
      hasTrackedWatchRef.current = true;
      trackVideoEvent("watch_in_app", analyticsBase);
    }

    const timeoutId = window.setTimeout(() => {
      setPlayerState((current) => {
        if (current !== "loading") {
          return current;
        }
        trackVideoEvent("embed_error", { ...analyticsBase, reason: "load_timeout" });
        return "error";
      });
    }, EMBED_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, embedUrl, analyticsBase, reportEmbedError]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalPortal>
      <div
        className="youtube-player-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={dialogRef}
          className="youtube-player-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={playerState === "error" ? errorDescriptionId : undefined}
          tabIndex={-1}
          data-testid="youtube-player-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="youtube-player-modal__header">
            <h2 className="youtube-player-modal__title" id={titleId}>
              {displayTitle}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="youtube-player-modal__close"
              onClick={onClose}
              aria-label="Close video player"
              data-testid="youtube-player-close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="youtube-player-modal__body">
            {playerState === "error" ? (
              <div className="youtube-player-modal__error" role="alert" data-testid="youtube-player-error">
                <p className="youtube-player-modal__error-title">Unable to play this video here</p>
                <p className="youtube-player-modal__error-copy" id={errorDescriptionId}>
                  The video may be private, restricted, or blocked from embedding. You can open it
                  directly on YouTube instead.
                </p>
                <button
                  type="button"
                  className="btn-primary youtube-player-modal__external-btn"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink size={16} aria-hidden />
                  Open in YouTube
                </button>
              </div>
            ) : (
              <div className="youtube-player-modal__player">
                {playerState === "loading" && (
                  <div className="youtube-player-modal__loading" aria-live="polite">
                    Loading video…
                  </div>
                )}
                {embedUrl && (
                  <iframe
                    className="youtube-player-modal__iframe"
                    data-testid="youtube-player-iframe"
                    src={embedUrl}
                    title={displayTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                  />
                )}
              </div>
            )}
          </div>

          {playerState !== "error" && (
            <div className="youtube-player-modal__footer">
              <button
                type="button"
                className="btn-secondary youtube-player-modal__external-link"
                onClick={handleOpenExternal}
              >
                <ExternalLink size={14} aria-hidden />
                Open in YouTube
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default YoutubePlayerModal;
