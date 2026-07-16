import React from "react";
import type { GenerationProgressOut } from "../types/generationProgress.types";
import type { GenerationRunPauseContextOut } from "../types/generationJob.types";
import { formatGenerationFailureMessage } from "../utils/formatGenerationFailureMessage";
import { formatGenerationPausedMessage } from "../utils/formatGenerationPausedMessage";

interface GenerationProgressPanelProps {
  title: string;
  subtitle: string;
  progress: GenerationProgressOut | null;
  /** Compact layout for floating docks — does not stretch to fill the page. */
  compact?: boolean;
  failedRunId?: string | null;
  pausedRunId?: string | null;
  resumable?: boolean;
  secondsUntilRetry?: number | null;
  isResuming?: boolean;
  isPausing?: boolean;
  isAbandoning?: boolean;
  canPause?: boolean;
  pauseContext?: GenerationRunPauseContextOut | null;
  onPause?: () => void;
  onResume?: () => void;
  onAbandon?: () => void;
}

function formatRetryCountdown(seconds: number): string {
  if (seconds <= 0) return "Ready to resume";
  if (seconds < 60) return `Resume available in ${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `Resume available in ${minutes} min`;
}

const GenerationProgressPanel: React.FC<GenerationProgressPanelProps> = ({
  title,
  subtitle,
  progress,
  compact = false,
  failedRunId = null,
  pausedRunId = null,
  resumable = false,
  secondsUntilRetry = null,
  isResuming = false,
  isPausing = false,
  isAbandoning = false,
  canPause = false,
  pauseContext = null,
  onPause,
  onResume,
  onAbandon,
}) => {
  const steps = progress?.steps ?? [];
  const progressStatus = progress?.status;
  const hasLiveRunningProgress = progressStatus === "running";
  // Brief handshake after Continue: spinner + "Resuming…" only — no stale checklist.
  // Once live running progress arrives, use the same UI as a fresh generation.
  const showResumePlaceholder = Boolean(isResuming && !hasLiveRunningProgress);
  // While Continue is in flight, never keep the paused chrome — even if the last
  // poll still says "paused". Outside resume, a non-null pausedRunId remains
  // authoritative so Cancel can flip to the paused UI before the poll catches up.
  const isUserPaused =
    !isResuming
    && (
      progressStatus === "paused"
      || Boolean(pausedRunId && onResume)
    );
  const isFailed =
    !isUserPaused
    && !isResuming
    && (progressStatus === "failed" || Boolean(failedRunId && onResume));
  const isRunning =
    isResuming
    || (!isUserPaused && !isFailed && progressStatus !== "completed");
  const showResumeActions = Boolean((isUserPaused || isFailed) && (pausedRunId || failedRunId) && onResume);
  const showAbandon = Boolean(onAbandon && (isUserPaused || isFailed));
  const showPause = Boolean(isRunning && !isResuming && onPause && (canPause || isPausing));
  const resumeDisabled =
    isResuming || isAbandoning || !resumable || (secondsUntilRetry != null && secondsUntilRetry > 0);
  const visibleSteps = showResumePlaceholder ? [] : steps;

  const pausedCopy = isUserPaused
    ? formatGenerationPausedMessage(progress, pauseContext)
    : null;
  const failureCopy = isFailed ? formatGenerationFailureMessage(progress) : null;

  const displayTitle = isUserPaused
    ? (pausedCopy?.headline ?? "Generation paused")
    : isFailed
      ? "Generation failed"
      : isPausing
        ? "Pausing…"
        : showResumePlaceholder
          ? "Resuming…"
          : title;
  const displaySubtitle = isPausing
    ? "Saving the current checkpoint before pausing."
    : isUserPaused
      ? pausedCopy?.prompt ?? "You can resume from the last saved checkpoint."
      : isFailed
        ? failureCopy?.headline ?? progress?.error ?? "Generation failed."
        : showResumePlaceholder
          ? "Recovering progress from the last checkpoint."
          : progress
            ? subtitle
            : "Starting…";

  const panelModifier = isUserPaused
    ? " generation-progress--paused"
    : isFailed
      ? " generation-progress--failed"
      : "";

  return (
    <div
      className={`generation-progress${
        compact ? " generation-progress--compact" : ""
      }${panelModifier}`}
      role="status"
      aria-live="polite"
      aria-busy={isRunning}
    >
      {isRunning && (
        <span className="spinner generation-progress__spinner" aria-hidden />
      )}
      {(isUserPaused || isFailed) && (
        <div className="generation-progress__failed-icon" aria-hidden>
          {isUserPaused ? "⏸" : "!"}
        </div>
      )}
      <p className="generation-progress__title">{displayTitle}</p>
      <p className="generation-progress__subtitle">{displaySubtitle}</p>
      {isUserPaused && (
        <p className="generation-progress__failed-prompt">
          Resume continues with the same reference and settings. To use a different file, delete this run and generate again.
        </p>
      )}
      {isFailed && failureCopy?.prompt && (
        <p className="generation-progress__failed-prompt">{failureCopy.prompt}</p>
      )}

      {(showPause || showResumeActions || showAbandon) && (
        <div className="generation-progress__actions">
          {showPause && (
            <button
              type="button"
              className="btn-secondary generation-progress__action-btn"
              onClick={onPause}
              disabled={isPausing || isAbandoning}
            >
              {isPausing ? "Pausing…" : "Pause generation"}
            </button>
          )}
          {showResumeActions && (
            <button
              type="button"
              className="btn-primary generation-progress__action-btn"
              onClick={onResume}
              disabled={resumeDisabled}
            >
              {isResuming ? "Continuing…" : "Continue"}
            </button>
          )}
          {showAbandon && (
            <button
              type="button"
              className="btn-secondary generation-progress__action-btn"
              onClick={onAbandon}
              disabled={isResuming || isPausing || isAbandoning}
            >
              {isAbandoning ? "Deleting…" : "Delete run"}
            </button>
          )}
          {showResumeActions && secondsUntilRetry != null && secondsUntilRetry > 0 && (
            <p className="generation-progress__retry-note">
              {formatRetryCountdown(secondsUntilRetry)}
            </p>
          )}
          {showResumeActions && resumable && secondsUntilRetry === 0 && (
            <p className="generation-progress__retry-note">
              You can resume from the last saved checkpoint.
            </p>
          )}
        </div>
      )}

      {visibleSteps.length > 0 && (
        <ol className="generation-progress__steps" aria-label="Generation progress">
          {visibleSteps.map((step, index) => (
            <li
              key={step.id}
              className={`generation-progress__step generation-progress__step--${step.status}${
                (isUserPaused || isFailed) && step.status === "active"
                  ? " generation-progress__step--interrupted"
                  : ""
              }${index < visibleSteps.length - 1 ? " generation-progress__step--has-line" : ""}`}
            >
              <span className="generation-progress__dot" aria-hidden />
              <span className="generation-progress__label">{step.label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default GenerationProgressPanel;
