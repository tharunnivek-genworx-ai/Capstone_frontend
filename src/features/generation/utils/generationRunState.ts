import type { GenerationPipeline } from "../../generation/types/generationProgress.types";
import type { NodeStudyStatePatch } from "../../study_material/types/studyMaterial.types";
import { getGenerationJobFailedRunId } from "./generationJobErrors";

export function patchForGenerationJobStart(): NodeStudyStatePatch {
  return {
    generationRunFailed: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
  };
}

export function patchForGenerationJobSuccess(): NodeStudyStatePatch {
  return {
    isGenerating: false,
    isGeneratingQuiz: false,
    isGeneratingHints: false,
    generationRunFailed: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
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
    failedGenerationPipeline: pipeline,
    generationProgressSessionId: runId,
    activeGenerationRunId: runId,
  };
}

export function patchClearFailedGenerationRun(): NodeStudyStatePatch {
  return {
    generationRunFailed: false,
    failedGenerationPipeline: null,
    generationProgressSessionId: null,
    activeGenerationRunId: null,
  };
}
