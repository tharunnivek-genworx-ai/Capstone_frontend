import type { GenerationPipeline, GenerationProgressOut } from "../../generation/types/generationProgress.types";
import type { NodeStudyStatePatch } from "../../study_material/types/studyMaterial.types";
import { getGenerationJobFailedRunId } from "./generationJobErrors";

export function patchForGenerationJobStart(): NodeStudyStatePatch {
  return {
    generationRunFailed: false,
    generationRunPaused: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
    generationProgress: null,
    isPausingGeneration: false,
    isAbandoningGeneration: false,
  };
}

export function patchForGenerationJobSuccess(): NodeStudyStatePatch {
  return {
    isGenerating: false,
    isGeneratingQuiz: false,
    isGeneratingHints: false,
    generationRunFailed: false,
    generationRunPaused: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
    generationProgress: null,
    isPausingGeneration: false,
    isAbandoningGeneration: false,
  };
}

export function patchForGenerationJobFailure(
  error: unknown,
  fallbackRunId: string | null,
  pipeline: GenerationPipeline,
): NodeStudyStatePatch {
  const runId = getGenerationJobFailedRunId(error) ?? fallbackRunId;
  if (!runId) {
    return patchForGenerationJobSuccess();
  }
  return {
    isGenerating: false,
    isGeneratingQuiz: false,
    isGeneratingHints: false,
    generationRunFailed: true,
    generationRunPaused: false,
    failedGenerationPipeline: pipeline,
    generationProgressSessionId: runId,
    activeGenerationRunId: runId,
    isPausingGeneration: false,
    isAbandoningGeneration: false,
  };
}

export function patchForGenerationJobPaused(
  runId: string,
  pipeline: GenerationPipeline,
): NodeStudyStatePatch {
  return {
    isGenerating: false,
    isGeneratingQuiz: false,
    isGeneratingHints: false,
    generationRunFailed: false,
    generationRunPaused: true,
    failedGenerationPipeline: pipeline,
    generationProgressSessionId: runId,
    activeGenerationRunId: runId,
    isPausingGeneration: false,
  };
}

export function patchForGenerationJobAbandoned(): NodeStudyStatePatch {
  return {
    isGenerating: false,
    isGeneratingQuiz: false,
    isGeneratingHints: false,
    generationRunFailed: false,
    generationRunPaused: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
    generationProgress: null,
    isPausingGeneration: false,
    isAbandoningGeneration: false,
  };
}

export function patchClearFailedGenerationRun(): NodeStudyStatePatch {
  return {
    generationRunFailed: false,
    generationRunPaused: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
    generationProgress: null,
  };
}

export function patchGenerationProgressUpdate(
  progress: GenerationProgressOut,
): NodeStudyStatePatch {
  return {
    generationProgressSessionId: progress.session_id,
    activeGenerationRunId: progress.session_id,
    generationProgress: progress,
  };
}
