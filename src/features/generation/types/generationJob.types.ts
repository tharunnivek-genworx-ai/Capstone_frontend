import type { GenerationPipeline } from "./generationProgress.types";

export interface GenerationJobStartResponse {
  run_id: string;
  pipeline: GenerationPipeline;
  status: "running";
}

export interface GenerationRunActiveOut {
  run_id: string;
  pipeline: GenerationPipeline;
  status: string;
  step_profile?: string | null;
  generation_mode?: string | null;
  resumable?: boolean;
  seconds_until_retry?: number | null;
}

export interface GenerationRunOut {
  run_id: string;
  pipeline: GenerationPipeline;
  status: string;
  error_message?: string | null;
  error_type?: string | null;
  resumable: boolean;
  seconds_until_retry?: number | null;
  attempt_count?: number;
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
