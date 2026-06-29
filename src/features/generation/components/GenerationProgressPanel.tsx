import React, { useEffect, useRef, useState } from "react";
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

// How long each step stays "active" in the animated fallback (ms)
const STEP_DURATION_MS = 8000;

const GenerationProgressPanel: React.FC<GenerationProgressPanelProps> = ({
  title,
  subtitle,
  progress,
  fallbackSteps = DEFAULT_STUDY_STEPS,
}) => {
  // Animated step index used only when real progress data is absent
  const [animatedStepIndex, setAnimatedStepIndex] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasRealProgress = Boolean(progress?.steps?.length);

  useEffect(() => {
    if (hasRealProgress) {
      // Real data from backend — no need for animation
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      return;
    }

    // No real data yet — animate the steps time-based
    setAnimatedStepIndex(0);
    stepTimerRef.current = setInterval(() => {
      setAnimatedStepIndex((prev) => {
        const maxIndex = fallbackSteps.length - 1;
        // Stop at the last step instead of looping
        return prev < maxIndex ? prev + 1 : prev;
      });
    }, STEP_DURATION_MS);

    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, [hasRealProgress, fallbackSteps.length]);

  const steps = hasRealProgress
    ? progress!.steps
    : fallbackSteps.map((step, index) => ({
        ...step,
        status:
          index < animatedStepIndex
            ? ("completed" as const)
            : index === animatedStepIndex
            ? ("active" as const)
            : ("pending" as const),
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
