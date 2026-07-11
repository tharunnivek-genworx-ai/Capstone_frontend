import React from "react";
import type { GenerationProgressOut } from "../types/generationProgress.types";
import { formatGenerationFailureMessage } from "../utils/formatGenerationFailureMessage";

interface GenerationProgressPanelProps {
  title: string;
  subtitle: string;
  progress: GenerationProgressOut | null;
  /** Compact layout for floating docks — does not stretch to fill the page. */
  compact?: boolean;
  failedRunId?: string | null;
  resumable?: boolean;
  secondsUntilRetry?: number | null;
  isResuming?: boolean;
  onResume?: () => void;
  onDismissFailed?: () => void;
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
  resumable = false,
  secondsUntilRetry = null,
  isResuming = false,
  onResume,
  onDismissFailed,
}) => {
  const steps = progress?.steps ?? [];
  const isFailed = progress?.status === "failed" || Boolean(failedRunId && onResume);
  const showFailedActions = Boolean(isFailed && failedRunId && onResume);
  const resumeDisabled =
    isResuming || !resumable || (secondsUntilRetry != null && secondsUntilRetry > 0);
  const failureCopy = isFailed ? formatGenerationFailureMessage(progress) : null;

  const displayTitle = isFailed ? "Generation paused" : title;
  const displaySubtitle = isFailed
    ? failureCopy?.headline ?? progress?.error ?? "Generation failed."
    : progress
      ? subtitle
      : "Starting…";

  return (
    <div
      className={`generation-progress${
        compact ? " generation-progress--compact" : ""
      }${isFailed ? " generation-progress--failed" : ""}`}
    >
      {!isFailed && (
        <span className="spinner generation-progress__spinner" aria-hidden />
      )}
      {isFailed && (
        <div className="generation-progress__failed-icon" aria-hidden>
          !
        </div>
      )}
      <p className="generation-progress__title">{displayTitle}</p>
      <p className="generation-progress__subtitle">{displaySubtitle}</p>
      {isFailed && failureCopy?.prompt && (
        <p className="generation-progress__failed-prompt">{failureCopy.prompt}</p>
      )}

      {showFailedActions && (
        <div className="generation-progress__actions">
          <button
            type="button"
            className="btn-primary generation-progress__action-btn"
            onClick={onResume}
            disabled={resumeDisabled}
          >
            {isResuming ? "Continuing…" : "Continue"}
          </button>
          {onDismissFailed && (
            <button
              type="button"
              className="btn-secondary generation-progress__action-btn"
              onClick={onDismissFailed}
              disabled={isResuming}
            >
              Dismiss
            </button>
          )}
          {secondsUntilRetry != null && secondsUntilRetry > 0 && (
            <p className="generation-progress__retry-note">
              {formatRetryCountdown(secondsUntilRetry)}
            </p>
          )}
          {resumable && secondsUntilRetry === 0 && (
            <p className="generation-progress__retry-note">
              You can resume from the last saved checkpoint.
            </p>
          )}
        </div>
      )}

      {steps.length > 0 && (
        <ol className="generation-progress__steps" aria-label="Generation progress">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`generation-progress__step generation-progress__step--${step.status}${
                isFailed && step.status === "active" ? " generation-progress__step--interrupted" : ""
              }${index < steps.length - 1 ? " generation-progress__step--has-line" : ""}`}
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
