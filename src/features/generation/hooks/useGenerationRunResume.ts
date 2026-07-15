import { useEffect, useState } from "react";
import { generationJobService } from "../services/generationProgressService";
import type { GenerationRunOut, GenerationRunPauseContextOut } from "../types/generationJob.types";

const RETRY_POLL_MS = 5000;
const ACTIVE_POLL_MS = 3000;

export function useGenerationRunResume(runId: string | null | undefined) {
  const [loaded, setLoaded] = useState<{
    runId: string;
    meta: GenerationRunOut | null;
  } | null>(null);
  const runMeta = loaded && loaded.runId === runId ? loaded.meta : null;

  useEffect(() => {
    if (!runId) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const poll = async () => {
      try {
        const next = await generationJobService.getRun(runId);
        if (cancelled) return;
        setLoaded({ runId, meta: next });
        const isRunning = next.status === "running";
        const waitingOnCooldown =
          !next.resumable && next.seconds_until_retry != null;
        if (isRunning || waitingOnCooldown) {
          timeoutId = window.setTimeout(
            () => void poll(),
            isRunning ? ACTIVE_POLL_MS : RETRY_POLL_MS,
          );
        }
      } catch {
        if (!cancelled) setLoaded({ runId, meta: null });
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [runId]);

  const actions = runMeta?.actions;

  return {
    resumable: actions?.can_resume ?? runMeta?.resumable ?? false,
    secondsUntilRetry: runMeta?.seconds_until_retry ?? null,
    canPause: actions?.can_pause ?? false,
    pauseContext: (actions?.pause_context ?? null) as GenerationRunPauseContextOut | null,
  };
}
