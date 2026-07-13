import type { GenerationProgressOut } from "../types/generationProgress.types";
import type { GenerationRunPauseContextOut } from "../types/generationJob.types";

function lowercaseFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Build mentor-friendly copy for a user-paused generation run.
 */
export function formatGenerationPausedMessage(
  progress: GenerationProgressOut | null,
  pauseContext?: GenerationRunPauseContextOut | null,
): { headline: string; prompt: string } {
  if (pauseContext?.headline) {
    const interrupted = pauseContext.interrupted_step_label;
    if (interrupted) {
      return {
        headline: pauseContext.headline,
        prompt: `We stopped while ${lowercaseFirst(interrupted)}. You can resume from the last saved checkpoint or delete this run.`,
      };
    }
    return {
      headline: pauseContext.headline,
      prompt: "You can resume from the last saved checkpoint or delete this run.",
    };
  }

  const steps = progress?.steps ?? [];
  const activeStep = steps.find((step) => step.status === "active");
  const completedSteps = steps.filter((step) => step.status === "completed");
  const lastCompleted = completedSteps[completedSteps.length - 1];

  if (activeStep?.label) {
    return {
      headline: `Paused while ${lowercaseFirst(activeStep.label)}.`,
      prompt: "You can resume from the last saved checkpoint or delete this run.",
    };
  }

  if (lastCompleted?.label) {
    return {
      headline: `Paused after ${lowercaseFirst(lastCompleted.label)}.`,
      prompt: "You can resume from the last saved checkpoint or delete this run.",
    };
  }

  return {
    headline: "Generation paused.",
    prompt: "You can resume from the last saved checkpoint or delete this run.",
  };
}
