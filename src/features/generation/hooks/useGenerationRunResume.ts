import { useCallback, useEffect, useState } from "react";
import { generationJobService } from "../services/generationProgressService";
import type { GenerationRunOut } from "../types/generationJob.types";

const RETRY_POLL_MS = 5000;

export function useGenerationRunResume(runId: string | null | undefined) {
  const [runMeta, setRunMeta] = useState<GenerationRunOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!runId) {
      setRunMeta(null);
      return;
    }
    setIsLoading(true);
    try {
      const next = await generationJobService.getRun(runId);
      setRunMeta(next);
    } catch {
      setRunMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!runId || !runMeta || runMeta.resumable || runMeta.seconds_until_retry == null) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void refresh();
    }, RETRY_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [runId, runMeta, refresh]);

  return {
    runMeta,
    isLoading,
    resumable: runMeta?.resumable ?? false,
    secondsUntilRetry: runMeta?.seconds_until_retry ?? null,
    refresh,
  };
}
