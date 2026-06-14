export type StudyMaterialGenerationType =
  | "generate"
  | "regenerate"
  | "improve"
  | "manual_edit";

export type ReferenceMaterialScope = "space" | "node";

export interface ReferenceMaterialOut {
  material_id: string;
  space_id: string;
  node_id: string | null;
  title: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string;
  scope: ReferenceMaterialScope;
  is_visible_to_trainees: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface ReferenceMaterialListOut {
  items: ReferenceMaterialOut[];
  total: number;
}

/** First-time generate — backend no longer accepts generation_type on this endpoint. */
export interface StudyMaterialGenerateRequest {
  reference_material_id?: string | null;
}

export interface StudyMaterialRegenerateRequest {
  mentor_regeneration_goal: string;
}

export interface StudyMaterialImproveRequest {
  mentor_feedback: string;
}

export interface StudyMaterialManualEditRequest {
  content: string;
}

export interface StudyMaterialPublishRequest {
  version_id: string;
}

export interface StudyMaterialActivateRequest {
  version_id: string;
}

export interface VersionLineageItem {
  version_id: string;
  version_number: number;
  generation_type: StudyMaterialGenerationType;
  is_archived: boolean;
}

export interface StudyMaterialVersionOut {
  version_id: string;
  node_id: string;
  space_id: string;
  version_number: number;
  content: string;
  generation_type: StudyMaterialGenerationType;
  mentor_feedback_used: string | null;
  reference_material_id: string | null;
  based_on_version_id: string | null;
  is_active: boolean;
  is_published: boolean;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  display_label: string;
}

export interface StudyMaterialVersionSummary {
  version_id: string;
  version_number: number;
  generation_type: StudyMaterialGenerationType;
  based_on_version_id: string | null;
  based_on_version_number: number | null;
  lineage_chain: VersionLineageItem[];
  mentor_feedback_preview: string | null;
  reference_material_id: string | null;
  is_active: boolean;
  is_published: boolean;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  display_label: string;
}

export interface StudyMaterialVersionHistoryOut {
  node_id: string;
  versions: StudyMaterialVersionSummary[];
  total: number;
}

export interface StudyMaterialClearDraftsEligibilityOut {
  can_clear: boolean;
  version_count: number;
  quiz_count: number;
  block_reason: string | null;
}

export interface StudyMaterialClearDraftsOut {
  node_id: string;
  deleted_count: number;
}

export interface VersionAllowedActionsOut {
  version_id: string;
  can_publish: boolean;
  can_unpublish: boolean;
  can_archive: boolean;
  can_edit_active_draft: boolean;
  is_viewing_non_active: boolean;
  is_viewing_archived: boolean;
}

export interface StudyMaterialMentorUiStateOut {
  node_id: string;
  has_versions: boolean;
  active_version_id: string | null;
  can_access_study_material: boolean;
  can_access_quiz: boolean;
  instruction_changed_since_generation: boolean;
  current_effective_instruction: string;
  generation_instruction_snapshot: string | null;
  displayed_version_actions: VersionAllowedActionsOut | null;
}

/** GET /nodes/:id/study-material — trainee-safe published content */
export interface TraineeStudyMaterialOut {
  version_id: string;
  node_id: string;
  space_id: string;
  version_number: number;
  content: string;
  reference_material_id: string | null;
  published_at: string | null;
}

/** PATCH /nodes/:id/study-material/progress */
export interface StudyMaterialProgressUpdateRequest {
  read_percent: number;
}

export interface StudyMaterialProgressOut {
  node_id: string;
  study_material_viewed: boolean;
  study_material_read_percent: number;
  study_material_completed: boolean;
  completion_status: string;
}

export interface NodeMediaOut {
  media_id: string;
  node_id: string;
  space_id: string;
  media_type: "image" | "video_url" | "article_link";
  title: string | null;
  url: string | null;
  file_url: string | null;
  public_url: string | null;
  order_index: number;
  uploaded_by: string;
  source_pdf_material_id: string | null;
  source_page_number: number | null;
  created_at: string | null;
}

export interface NodeMediaListOut {
  items: NodeMediaOut[];
  total: number;
}

export interface ReferenceImageOut {
  filename: string;
  url: string;
  source_page: number | null;
  title?: string | null;
}

export interface ReferenceImageListOut {
  material_id: string;
  items: ReferenceImageOut[];
  total: number;
}

// ── UI-level types ────────────────────────────────────────────────────────────

import type { TopicContentPage } from "../../spaces/types/node.types";

/** Feedback action mode for study material regeneration or improvement */
export type StudyMaterialFeedbackMode = "regenerate" | "improve";

/** Partial update for node-level study state — used by state lifting between components */
export interface NodeStudyStatePatch {
  currentPage?: TopicContentPage;
  hasTriggeredGeneration?: boolean;
  studyMaterialContent?: string | null;
  activeVersion?: StudyMaterialVersionOut | null;
  isGenerating?: boolean;
  referenceMaterial?: ReferenceMaterialOut | null;
}

/** Full node-level study state — each node has its own instance */
export interface NodeStudyState {
  currentPage: TopicContentPage;
  hasTriggeredGeneration: boolean;
  studyMaterialContent: string | null;
  activeVersion: StudyMaterialVersionOut | null;
  isGenerating: boolean;
  referenceMaterial: ReferenceMaterialOut | null;
}
