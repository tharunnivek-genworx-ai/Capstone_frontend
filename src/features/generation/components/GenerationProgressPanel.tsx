import React from "react";
import type { GenerationProgressOut } from "../types/generationProgress.types";

interface GenerationProgressPanelProps {
  title: string;
  subtitle: string;
  progress: GenerationProgressOut | null;
  fallbackSteps?: Array<{ id: string; label: string }>;
}

const DEFAULT_STUDY_STEPS = [
  { id: "preparing", label: "Preparing materials" },
  { id: "outlining", label: "Outlining the topics to cover" },
  { id: "generating", label: "Generating study material" },
  { id: "analyzing", label: "Analyzing the quality of the content" },
];

const GenerationProgressPanel: React.FC<GenerationProgressPanelProps> = ({
  title,
  subtitle,
  progress,
  fallbackSteps = DEFAULT_STUDY_STEPS,
}) => {
  const steps = progress?.steps?.length ? progress.steps : fallbackSteps.map((step, index) => ({
    ...step,
    status: index === 0 ? "active" as const : "pending" as const,
  }));

  return (
    <div className="generation-progress">
      <span className="spinner generation-progress__spinner" aria-hidden />
      <p className="generation-progress__title">{title}</p>
      <p className="generation-progress__subtitle">{subtitle}</p>

      <ol className="generation-progress__steps" aria-label="Generation progress">
        {steps.map((step, index) => {
          const status = "status" in step ? step.status : "pending";
          return (
            <li
              key={step.id}
              className={`generation-progress__step generation-progress__step--${status}${
                index < steps.length - 1 ? " generation-progress__step--has-line" : ""
              }`}
            >
              <span className="generation-progress__dot" aria-hidden />
              <span className="generation-progress__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default GenerationProgressPanel;
