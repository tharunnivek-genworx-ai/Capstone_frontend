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
  resource_type: "node" | "quiz";
  resource_id: string;
  node_id: string;
  space_id: string;
  mentor_id: string;
  status: string;
  last_completed_node?: string | null;
  generation_mode: string;
  artifact_run_id?: string | null;
  progress_step_index: number;
  error_message?: string | null;
  error_type?: string | null;
  next_llm_retry_at?: string | null;
  resumable: boolean;
  seconds_until_retry?: number | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  paused_at?: string | null;
  abandoned_at?: string | null;
  pause_reason?: string | null;
  abandon_reason?: string | null;
  fingerprint_mismatch?: boolean;
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
