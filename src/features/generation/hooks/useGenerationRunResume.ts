import { useCallback, useEffect, useState } from "react";
import { generationJobService } from "../services/generationProgressService";
import type { GenerationRunOut, GenerationRunPauseContextOut } from "../types/generationJob.types";

const RETRY_POLL_MS = 5000;
const ACTIVE_POLL_MS = 3000;

export function useGenerationRunResume(runId: string | null | undefined) {
  const [runMeta, setRunMeta] = useState<GenerationRunOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trackedRunId, setTrackedRunId] = useState(runId ?? null);

  if ((runId ?? null) !== trackedRunId) {
    setTrackedRunId(runId ?? null);
    if (!runId) {
      setRunMeta(null);
      setIsLoading(false);
    }
  }

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
    if (!runId) return;

    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoading(true);
      try {
        const next = await generationJobService.getRun(runId);
        if (!cancelled) setRunMeta(next);
      } catch {
        if (!cancelled) setRunMeta(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId]);

  useEffect(() => {
    if (!runId || !runMeta) {
      return;
    }
    const isRunning = runMeta.status === "running";
    const waitingOnCooldown =
      !runMeta.resumable && runMeta.seconds_until_retry != null;
    if (!isRunning && !waitingOnCooldown) {
      return;
    }
    const intervalMs = isRunning ? ACTIVE_POLL_MS : RETRY_POLL_MS;
    const intervalId = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [runId, runMeta, refresh]);

  const actions = runMeta?.actions;

  return {
    runMeta,
    isLoading,
    resumable: actions?.can_resume ?? runMeta?.resumable ?? false,
    secondsUntilRetry: runMeta?.seconds_until_retry ?? null,
    canPause: actions?.can_pause ?? false,
    canResume: actions?.can_resume ?? runMeta?.resumable ?? false,
    canAbandon: actions?.can_abandon ?? false,
    pauseContext: (actions?.pause_context ?? null) as GenerationRunPauseContextOut | null,
    refresh,
  };
}
