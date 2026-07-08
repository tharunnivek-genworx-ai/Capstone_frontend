import type { GenerationPipeline } from "./generationProgress.types";

export interface GenerationJobStartResponse {
  run_id: string;
  pipeline: GenerationPipeline;
  status: "running";
}

export interface GenerationRunResultOut {
  run_id: string;
  pipeline: GenerationPipeline;
  status: string;
  error_message?: string | null;
  study_material_generate?: Record<string, unknown> | null;
  study_material_feedback?: Record<string, unknown> | null;
  quiz?: Record<string, unknown> | null;
}
