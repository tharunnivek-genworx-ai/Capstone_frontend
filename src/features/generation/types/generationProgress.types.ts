export type GenerationPipeline = "study_material" | "quiz" | "hint";

export type GenerationJobStatus = "running" | "completed" | "failed" | "paused";

export type GenerationStepStatus = "pending" | "active" | "completed";

export interface GenerationProgressStep {
  id: string;
  label: string;
  status: GenerationStepStatus;
}

export interface GenerationProgressOut {
  session_id: string;
  pipeline: GenerationPipeline;
  status: GenerationJobStatus;
  current_step_index: number;
  steps: GenerationProgressStep[];
  error?: string | null;
  pause_reason?: string | null;
}
