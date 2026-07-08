import React from "react";
import type { GenerationProgressOut } from "../types/generationProgress.types";

interface GenerationProgressPanelProps {
  title: string;
  subtitle: string;
  progress: GenerationProgressOut | null;
  /** Compact layout for floating docks — does not stretch to fill the page. */
  compact?: boolean;
}

const GenerationProgressPanel: React.FC<GenerationProgressPanelProps> = ({
  title,
  subtitle,
  progress,
  compact = false,
}) => {
  const steps = progress?.steps ?? [];
  const isFailed = progress?.status === "failed";
  const displaySubtitle = isFailed
    ? progress?.error ?? "Generation failed."
    : progress
      ? subtitle
      : "Starting…";

  return (
    <div className={`generation-progress${compact ? " generation-progress--compact" : ""}`}>
      <span className="spinner generation-progress__spinner" aria-hidden />
      <p className="generation-progress__title">{title}</p>
      <p className="generation-progress__subtitle">{displaySubtitle}</p>

      {steps.length > 0 && (
        <ol className="generation-progress__steps" aria-label="Generation progress">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`generation-progress__step generation-progress__step--${step.status}${
                index < steps.length - 1 ? " generation-progress__step--has-line" : ""
              }`}
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
