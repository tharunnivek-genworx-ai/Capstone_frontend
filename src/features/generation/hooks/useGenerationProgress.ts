import { useEffect, useState } from "react";
import { generationProgressService } from "../services/generationProgressService";
import type { GenerationProgressOut } from "../types/generationProgress.types";

const POLL_INTERVAL_MS = 1200;
const MAX_NOT_FOUND_RETRIES = 6;

function isNotFoundError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404;
}

export function useGenerationProgress(
  sessionId: string | null | undefined,
  isActive: boolean,
): GenerationProgressOut | null {
  const [loaded, setLoaded] = useState<{
    sessionId: string;
    progress: GenerationProgressOut | null;
  } | null>(null);
  const progress =
    isActive && loaded && loaded.sessionId === sessionId ? loaded.progress : null;

  useEffect(() => {
    if (!sessionId || !isActive) return;

    let cancelled = false;
    let notFoundRetries = 0;
    let timeoutId: number | null = null;

    const poll = async () => {
      let shouldContinue = true;
      try {
        const next = await generationProgressService.get(sessionId);
        if (cancelled) return;
        notFoundRetries = 0;
        setLoaded({ sessionId, progress: next });
        shouldContinue = next.status === "running";
      } catch (error) {
        if (isNotFoundError(error) && notFoundRetries < MAX_NOT_FOUND_RETRIES) {
          notFoundRetries += 1;
        } else {
          shouldContinue = false;
          if (!cancelled) setLoaded({ sessionId, progress: null });
        }
      }
      if (!cancelled && shouldContinue) {
        timeoutId = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [sessionId, isActive]);

  return progress;
}
