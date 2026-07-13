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

export interface GenerationRunPauseContextOut {
  headline: string;
  interrupted_step_label?: string | null;
  last_completed_node?: string | null;
}

export interface GenerationRunActionsOut {
  can_pause: boolean;
  can_resume: boolean;
  can_abandon: boolean;
  pause_context?: GenerationRunPauseContextOut | null;
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
  actions?: GenerationRunActionsOut | null;
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
