import type { GenerationProgressOut } from "../types/generationProgress.types";

function lowercaseFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Build mentor-friendly copy for a frozen progress screen after a failed run.
 * Uses the in-progress step when available, otherwise the last completed step.
 */
export function formatGenerationFailureMessage(
  progress: GenerationProgressOut | null,
): { headline: string; prompt: string } {
  const steps = progress?.steps ?? [];
  const activeStep = steps.find((step) => step.status === "active");
  const completedSteps = steps.filter((step) => step.status === "completed");
  const lastCompleted = completedSteps[completedSteps.length - 1];

  if (activeStep?.label) {
    return {
      headline: `We were ${lowercaseFirst(activeStep.label)} when an unexpected error occurred.`,
      prompt: "Would you like to continue from where we left off?",
    };
  }

  if (lastCompleted?.label) {
    return {
      headline: `We finished ${lowercaseFirst(lastCompleted.label)}, but an unexpected error occurred before the next step.`,
      prompt: "Would you like to continue from where we left off?",
    };
  }

  return {
    headline: "An unexpected error occurred during generation.",
    prompt: "Would you like to continue from the last saved checkpoint?",
  };
}
