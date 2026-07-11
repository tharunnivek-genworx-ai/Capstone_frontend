export type BatchStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type BatchItemStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "failed_retryable"
  | "skipped"
  | "cancelled";

export type ExistingMaterialPolicy = "skip" | "regenerate";

export interface StudyMaterialBatchPolicyIn {
  existing_material_policy: ExistingMaterialPolicy;
  failure_policy: "continue_on_error";
  reference_material_id?: string | null;
}

export interface StudyMaterialBatchPreviewRequest {
  root_node_ids: string[];
}

export interface StudyMaterialBatchPreviewItem {
  node_id: string;
  title: string;
  depth_level: number;
  path_titles: string[];
  root_segment_node_id: string;
  root_segment_title: string;
  can_generate: boolean;
  block_reason: string | null;
}

export interface StudyMaterialBatchPreviewWarningNode {
  node_id: string;
  title: string;
  path_titles?: string[];
}

export interface StudyMaterialBatchPreviewWarnings {
  missing_instruction_nodes: StudyMaterialBatchPreviewWarningNode[];
  inherits_section_default_nodes: StudyMaterialBatchPreviewWarningNode[];
  show_no_instruction_warning: boolean;
  show_inheritance_warning: boolean;
}

export interface StudyMaterialBatchPreviewRoot {
  node_id: string;
  title: string;
}

export interface StudyMaterialBatchPreviewResponse {
  roots: StudyMaterialBatchPreviewRoot[];
  items: StudyMaterialBatchPreviewItem[];
  warnings: StudyMaterialBatchPreviewWarnings;
}

export interface StudyMaterialBatchEnqueueRequest {
  root_node_ids: string[];
  policy: StudyMaterialBatchPolicyIn;
}

export interface BatchSummaryOut {
  batch_id: string;
  space_id: string;
  mentor_id: string;
  status: BatchStatus;
  queue_position: number;
  selected_root_node_ids: string[];
  total_items: number;
  completed_items: number;
  failed_items: number;
  skipped_items: number;
  current_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchCurrentItemOut {
  item_id: string;
  node_id: string;
  node_title: string;
  depth_level: number;
  path_titles: string[];
  generation_run_id: string | null;
  run_status: string | null;
  status: BatchItemStatus;
  error_message?: string | null;
}

export interface BatchRootSegmentProgressOut {
  root_node_id: string;
  root_title: string;
  completed: number;
  total: number;
}

export interface BatchOverallProgressOut {
  completed: number;
  total: number;
  failed: number;
  skipped: number;
}

export interface StudyMaterialSpaceQueueOut {
  running_batch: BatchSummaryOut | null;
  recent_terminal_batch?: BatchSummaryOut | null;
  queued_batches: BatchSummaryOut[];
  needs_advance: boolean;
  advance_deferred: boolean;
  overall_progress: BatchOverallProgressOut;
  current_root_segment: BatchRootSegmentProgressOut | null;
  current_item: BatchCurrentItemOut | null;
}

export interface StudyMaterialBatchDetailOut {
  batch: BatchSummaryOut;
  items: BatchCurrentItemOut[];
}

export interface StudyMaterialBatchCancelResponse {
  batch_id: string;
  status: BatchStatus;
}
