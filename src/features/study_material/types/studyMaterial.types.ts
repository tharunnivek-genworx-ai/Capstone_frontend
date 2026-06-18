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

export interface StudyMaterialPublishPreviewOut {
  requires_confirmation: boolean;
  has_draft_quizzes: boolean;
  has_published_quizzes: boolean;
  draft_quiz_count: number;
  previous_version_label: string | null;
  new_version_label: string;
  is_republishing_older: boolean;
  current_published_version_label: string | null;
}

export interface StudyMaterialUnpublishPreviewOut {
  requires_confirmation: boolean;
  has_draft_quizzes: boolean;
  has_published_quizzes: boolean;
  version_label: string;
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

export interface QualityCheckScoresOut {
  structure?: number | null;
  content_accuracy?: number | null;
  code_quality?: number | null;
  section_depth?: number | null;
  readability?: number | null;
  teaching_alignment?: number | null;
}

export interface QualityCheckResultOut {
  overall_status: "pass" | "warn" | "fail";
  is_refusal: boolean;
  hallucination_risk: "none" | "low" | "medium" | "high";
  scores: QualityCheckScoresOut;
  issues: string[];
  corrective_instructions: string;
  summary: string;
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
  qc_failed_permanently?: boolean;
  qc_result?: QualityCheckResultOut | null;
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
  publish_button_label?: string;
  publish_disabled_tooltip?: string | null;
  unpublish_disabled_tooltip?: string | null;
}

export interface StudyMaterialMentorUiStateOut {
  node_id: string;
  has_versions: boolean;
  active_version_id: string | null;
  published_version_id?: string | null;
  can_access_study_material: boolean;
  can_access_quiz: boolean;
  instruction_changed_since_generation: boolean;
  current_effective_instruction: string;
  generation_instruction_snapshot: string | null;
  displayed_version_actions: VersionAllowedActionsOut | null;
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
  created_at: string | null;
}

export interface NodeMediaListOut {
  items: NodeMediaOut[];
  total: number;
}

export interface ReferenceImageOut {
  llamaparse_image_id?: string;
  filename: string;
  url: string;
  source_page: number | null;
  title?: string | null;
}

export interface ReferenceImageListOut {
  material_id: string;
  node_id: string;
  items: ReferenceImageOut[];
  total: number;
}

export interface StudyMaterialFeedbackResponse {
  has_new_version: boolean;
  new_version_id: string | null;
  status: "ok" | "feedback_too_vague" | "regeneration_goal_too_vague";
  status_message: string | null;
  new_version: StudyMaterialVersionOut | null;
  qc_failed_permanently?: boolean;
  qc_result?: QualityCheckResultOut | null;
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
  currentQuizId?: string | null;
}

/** Full node-level study state — each node has its own instance */
export interface NodeStudyState {
  currentPage: TopicContentPage;
  hasTriggeredGeneration: boolean;
  studyMaterialContent: string | null;
  activeVersion: StudyMaterialVersionOut | null;
  isGenerating: boolean;
  referenceMaterial: ReferenceMaterialOut | null;
  currentQuizId: string | null;
}
