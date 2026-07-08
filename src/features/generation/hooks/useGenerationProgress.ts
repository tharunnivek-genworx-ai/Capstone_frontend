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
  const [progress, setProgress] = useState<GenerationProgressOut | null>(null);

  useEffect(() => {
    if (!sessionId || !isActive) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    let notFoundRetries = 0;

    const poll = async () => {
      try {
        const next = await generationProgressService.get(sessionId);
        if (!cancelled) {
          notFoundRetries = 0;
          setProgress(next);
        }
      } catch (error) {
        if (isNotFoundError(error) && notFoundRetries < MAX_NOT_FOUND_RETRIES) {
          notFoundRetries += 1;
          return;
        }
        if (!cancelled) {
          setProgress(null);
        }
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [sessionId, isActive]);

  return progress;
}
