import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generationJobService,
  generationProgressService,
} from "../services/generationProgressService";
import type { GenerationProgressOut } from "../types/generationProgress.types";

const POLL_INTERVAL_MS = 1200;
const MAX_NOT_FOUND_RETRIES = 6;

function isNotFoundError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404;
}

function isTerminalProgressStatus(
  status: GenerationProgressOut["status"] | undefined,
): boolean {
  return status === "paused" || status === "failed";
}

export function resolveGenerationProgress(
  isActive: boolean,
  sessionId: string | null | undefined,
  loaded: { sessionId: string; progress: GenerationProgressOut | null } | null,
  seedProgress: GenerationProgressOut | null | undefined,
  /**
   * When true (Continue / active generate), ignore paused/failed snapshots so a
   * stale pre-resume poll cannot freeze the checklist on the paused chrome.
   */
  suppressTerminalSnapshot = false,
): GenerationProgressOut | null {
  if (!isActive || !sessionId) return null;

  if (loaded?.sessionId === sessionId) {
    if (
      suppressTerminalSnapshot
      && isTerminalProgressStatus(loaded.progress?.status)
    ) {
      return null;
    }
    return loaded.progress;
  }

  if (seedProgress?.session_id !== sessionId) return null;

  if (suppressTerminalSnapshot && isTerminalProgressStatus(seedProgress.status)) {
    return null;
  }

  return seedProgress;
}

export function useGenerationProgress(
  sessionId: string | null | undefined,
  isActive: boolean,
  /**
   * When this flips to a new truthy/active value after pause/fail (e.g. isGenerating
   * or isResuming), polling restarts so Continue shows live progress again.
   */
  restartKey: string | number | boolean | null | undefined = null,
  /**
   * Per-node scope (e.g. topic node_id). Invalidates cached poll results when the
   * mentor switches topics so one node's checklist never bleeds into another.
   */
  scopeKey: string | null | undefined = null,
  /** Last-known progress for this node/session, updated by generation job callbacks. */
  seedProgress: GenerationProgressOut | null | undefined = null,
  onProgressUpdate?: (progress: GenerationProgressOut) => void,
): GenerationProgressOut | null {
  const [loaded, setLoaded] = useState<{
    sessionId: string;
    progress: GenerationProgressOut | null;
  } | null>(null);

  const suppressTerminalSnapshot = Boolean(restartKey);

  // Drop poll cache when the viewed topic or run changes.
  useEffect(() => {
    setLoaded(null);
  }, [scopeKey, sessionId]);

  // A same-session resume clears seed progress in the resume handlers. Clearing
  // the poll cache here ensures the first live poll (not a stale loaded snapshot)
  // drives the checklist after Continue.
  useEffect(() => {
    if (!isActive) return;
    setLoaded(null);
  }, [restartKey, isActive]);

  const progress = useMemo(
    () =>
      resolveGenerationProgress(
        isActive,
        sessionId,
        loaded,
        seedProgress,
        suppressTerminalSnapshot,
      ),
    [isActive, sessionId, loaded, seedProgress, suppressTerminalSnapshot],
  );

  const reportProgress = useCallback(
    (next: GenerationProgressOut) => {
      if (!sessionId || next.session_id !== sessionId) return;
      setLoaded({ sessionId, progress: next });
      onProgressUpdate?.(next);
    },
    [sessionId, onProgressUpdate],
  );

  useEffect(() => {
    if (!sessionId || !isActive) return;

    let cancelled = false;
    let notFoundRetries = 0;
    let timeoutId: number | null = null;
    let lastProgress: GenerationProgressOut | null = null;
    let sawRunning = false;

    const poll = async () => {
      let shouldContinue = true;
      try {
        const next = await generationProgressService.get(sessionId);
        if (cancelled) return;

        notFoundRetries = 0;
        // The progress endpoint already resolves status from the durable run row.
        // Avoid a second run-details request on every 1.2s poll tick.
        lastProgress = next;
        if (next.status === "running") {
          sawRunning = true;
        }
        reportProgress(next);

        if (next.status === "running") {
          shouldContinue = true;
        } else if (
          (next.status === "paused" || next.status === "failed")
          && Boolean(restartKey)
          && !sawRunning
        ) {
          // Stale terminal snapshot during the resume handshake — keep polling.
          shouldContinue = true;
        } else {
          shouldContinue = false;
        }
      } catch (error) {
        if (isNotFoundError(error) && notFoundRetries < MAX_NOT_FOUND_RETRIES) {
          notFoundRetries += 1;
        } else {
          try {
            const run = await generationJobService.getRun(sessionId);
            if (cancelled) return;
            const terminalStatus =
              run.status === "completed"
                ? "completed"
                : run.status === "paused"
                  ? "paused"
                  : run.status === "failed" || run.status === "abandoned"
                    ? "failed"
                    : null;
            if (lastProgress && terminalStatus) {
              const reconciled: GenerationProgressOut = {
                ...lastProgress,
                status: terminalStatus,
                error:
                  terminalStatus === "failed"
                    ? lastProgress.error ?? run.error_message ?? "Generation failed."
                    : lastProgress.error,
              };
              lastProgress = reconciled;
              reportProgress(reconciled);
              shouldContinue = false;
            } else {
              shouldContinue = run.status === "running" || !terminalStatus;
            }
          } catch {
            shouldContinue = true;
          }
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
  }, [sessionId, isActive, restartKey, reportProgress]);

  return progress;
}
