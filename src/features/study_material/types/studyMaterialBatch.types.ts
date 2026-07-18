export type BatchJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type BatchStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type BatchPolicyMode = "skip_existing" | "regenerate_all";

/** Wizard-facing policy labels (mapped to BatchPolicyMode in the service). */
export type ExistingMaterialPolicy = "skip" | "regenerate";

export interface BatchPolicyIn {
  mode: BatchPolicyMode;
  reference_material_id?: string | null;
  /** Topics that should run with external research enabled during this batch. */
  external_research_node_ids?: string[];
}

export interface BatchPreviewRequest {
  root_node_ids: string[];
  node_ids?: string[];
}

export interface BatchPreviewItem {
  node_id: string;
  title: string;
  depth_level: number;
  path_titles: string[];
  root_segment_node_id: string;
  root_segment_title: string;
  can_generate: boolean;
  block_reason: string | null;
}

export interface BatchPreviewWarningNode {
  node_id: string;
  title: string;
  path_titles?: string[];
}

export interface BatchPreviewWarnings {
  missing_instruction_nodes: BatchPreviewWarningNode[];
  inherits_section_default_nodes: BatchPreviewWarningNode[];
  show_no_instruction_warning: boolean;
  show_inheritance_warning: boolean;
}

export interface BatchPreviewRoot {
  node_id: string;
  title: string;
}

export interface BatchPreviewResponse {
  roots: BatchPreviewRoot[];
  items: BatchPreviewItem[];
  warnings: BatchPreviewWarnings;
}

export interface BatchCreateRequest {
  root_node_ids: string[];
  node_ids?: string[];
  policy: BatchPolicyIn;
  /** Convenience mirror of policy.external_research_node_ids for create payloads. */
  external_research_node_ids?: string[];
}

export interface BatchJobOut {
  batch_id: string;
  space_id: string;
  mentor_id: string;
  status: BatchJobStatus;
  policy: BatchPolicyIn;
  selected_root_node_ids: string[];
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface BatchStepOut {
  step_id: string;
  batch_id: string;
  position: number;
  node_id: string;
  node_title: string;
  path_titles: string[];
  depth_level: number;
  root_segment_node_id: string;
  status: BatchStepStatus;
  generation_run_id: string | null;
  run_status: string | null;
  error_message?: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface BatchDetailOut {
  batch: BatchJobOut;
  steps: BatchStepOut[];
}

export interface BatchCreateResponse {
  batch_id: string;
  status: BatchJobStatus;
}

export interface BatchCancelResponse {
  batch_id: string;
  status: BatchJobStatus;
}

// Legacy aliases kept for wizard components during migration.
export type StudyMaterialBatchPreviewRequest = BatchPreviewRequest;
export type StudyMaterialBatchPreviewItem = BatchPreviewItem;
export type StudyMaterialBatchPreviewWarningNode = BatchPreviewWarningNode;
export type StudyMaterialBatchPreviewWarnings = BatchPreviewWarnings;
export type StudyMaterialBatchPreviewRoot = BatchPreviewRoot;
export type StudyMaterialBatchPreviewResponse = BatchPreviewResponse;
