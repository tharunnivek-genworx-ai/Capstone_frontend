import { useEffect, useState } from "react";
import { generationProgressService } from "../services/generationProgressService";
import type { GenerationProgressOut } from "../types/generationProgress.types";

const POLL_INTERVAL_MS = 1200;

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

    const poll = async () => {
      try {
        const next = await generationProgressService.get(sessionId);
        if (!cancelled) {
          setProgress(next);
        }
      } catch {
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
