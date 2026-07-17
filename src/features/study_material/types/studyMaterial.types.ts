import type {
  GenerationPipeline,
  GenerationProgressOut,
} from "../../generation/types/generationProgress.types";

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
  /** Mutually exclusive with reference_material_id (API returns 400 if both). */
  external_research_enabled?: boolean;
}

/** Persisted on versions when External Research degraded to fail-soft (§14). */
export interface GenerationOutcomeDetail {
  message?: string | null;
  reason?: string | null;
  topic_received?: string | null;
  raw_preview?: string | null;
  external_research_fail_soft?: boolean | null;
  fail_reason?: string | null;
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
  superseded_retention_mode?: RetentionMode;
}

export type RetentionMode = "remove_completely" | "keep_for_review";

export interface StudyMaterialUnpublishRequest {
  version_id: string;
  retention_mode: RetentionMode;
}

export interface StudyMaterialPublishPreviewOut {
  requires_confirmation: boolean;
  previous_version_label: string | null;
  new_version_label: string;
  is_republishing_older: boolean;
  current_published_version_label: string | null;
  will_reset_trainee_read_progress: boolean;
  is_replacing_live_version: boolean;
}

export interface StudyMaterialUnpublishPreviewOut {
  requires_confirmation: boolean;
  version_label: string;
  trainees_read_count: number;
  trainees_quiz_attempt_count: number;
  has_live_quiz: boolean;
  live_quiz_title: string | null;
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

export interface ProviderMetaOut {
  apiKeyAlias?: string | null;
  attemptIndex?: number | null;
  graphNode?: string | null;
  retryAfterSeconds?: number | null;
  nextLlmRetryAt?: string | null;
}

export type LlmErrorType =
  | "rate_limited"
  | "token_limit"
  | "llm_infra_error"
  | "llm_key_pool_exhausted"
  | "hint_quality_error";

export type ConceptDomain = "STEM" | "Programming" | "Conceptual" | "Mixed" | "";

export interface TopicSplitEntryOut {
  id: string;
  heading: string;
  purpose?: string;
}

export interface ConceptPlanOut {
  domain?: ConceptDomain;
  topic_split?: TopicSplitEntryOut[];
  must_cover_checklist?: Array<{
    id: string;
    concept: string;
    section_id?: string | null;
  }>;
}

export interface QualityCheckItemOut {
  id: string;
  category: string;
  question: string;
  passed: boolean;
  severity: "critical" | "major" | "minor";
  evidence?: string;
  corrective_hint?: string;
  section_id?: string | null;
  checklist_id?: string | null;
}

export interface DetFailureDisplayOut {
  check_id: string;
  section_label: string;
  subsection_label?: string | null;
  user_message: string;
  tier: "formatting" | "structure" | "evidence";
}

export interface QcWarningPresentationOut {
  kind: "det_only" | "llm_content" | "mixed";
  alert_title: string;
  alert_body: string;
  det_summary?: string | null;
  reassurance?: string | null;
  formatting_items: DetFailureDisplayOut[];
  structure_items: DetFailureDisplayOut[];
  evidence_items: DetFailureDisplayOut[];
  formatting_list_label: string;
  structure_list_label: string;
  evidence_list_label: string;
  det_only_list_label: string;
  is_formatting_only: boolean;
  content_issues_label: string;
}

export interface QualityCheckResultOut {
  overall_status: "pass" | "warn" | "fail";
  is_refusal: boolean;
  hallucination_risk: "none" | "low" | "medium" | "high";
  scores: QualityCheckScoresOut;
  checks?: QualityCheckItemOut[];
  failed_checks?: QualityCheckItemOut[];
  verification_mode?: "full" | "targeted" | null;
  issues: string[];
  humanized_issues?: string[] | null;
  corrective_instructions: string;
  humanized_corrective_instructions?: string | null;
  summary: string;
  warning_presentation?: QcWarningPresentationOut | null;
  errorType?: LlmErrorType | null;
  suggestion?: string | null;
  providerMeta?: ProviderMetaOut | null;
  qcInfraError?: boolean | null;
  retryAfterSeconds?: number | null;
  nextLlmRetryAt?: string | null;
  mentorDismissedQcWarning?: boolean | null;
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
  lifecycle_status?: string;
  display_label: string;
  qc_failed_permanently?: boolean;
  qc_result?: QualityCheckResultOut | null;
  concept_plan?: ConceptPlanOut | null;
  next_llm_retry_at?: string | null;
  generation_outcome_detail?: GenerationOutcomeDetail | null;
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
  published_at: string | null;
  lifecycle_status: string;
  mentor_display_badge: string;
  student_visibility_hint: string | null;
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
  discarded_count: number;
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
  unpublish_button_label?: string;
  unpublish_tooltip?: string | null;
  unpublish_disabled_tooltip?: string | null;
}

export interface MentorStudentVisibilityOut {
  live_material_label: string | null;
  live_material_version_id: string | null;
  previous_version_count: number;
  previous_version_labels: string[];
  live_quiz_title: string | null;
}

export interface StudyMaterialMentorUiStateOut {
  node_id: string;
  has_versions: boolean;
  has_workspace_versions?: boolean;
  active_version_id: string | null;
  published_version_id?: string | null;
  can_access_study_material: boolean;
  can_access_quiz: boolean;
  instruction_changed_since_generation: boolean;
  current_effective_instruction: string;
  generation_instruction_snapshot: string | null;
  displayed_version_actions: VersionAllowedActionsOut | null;
  student_visibility: MentorStudentVisibilityOut;
}


export interface NodeMediaOut {
  media_id: string;
  node_id: string;
  space_id: string;
  media_type: "image" | "pdf" | "video_url" | "article_link";
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
  next_llm_retry_at?: string | null;
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
  isGeneratingQuiz?: boolean;
  isGeneratingHints?: boolean;
  generationProgressSessionId?: string | null;
  activeGenerationRunId?: string | null;
  generationRunFailed?: boolean;
  generationRunPaused?: boolean;
  failedGenerationPipeline?: GenerationPipeline | null;
  isPausingGeneration?: boolean;
  isAbandoningGeneration?: boolean;
  referenceMaterial?: ReferenceMaterialOut | null;
  currentQuizId?: string | null;
  generationProgress?: GenerationProgressOut | null;
}

/** Full node-level study state — each node has its own instance */
export interface NodeStudyState {
  currentPage: TopicContentPage;
  hasTriggeredGeneration: boolean;
  studyMaterialContent: string | null;
  activeVersion: StudyMaterialVersionOut | null;
  isGenerating: boolean;
  isGeneratingQuiz: boolean;
  isGeneratingHints: boolean;
  generationProgressSessionId: string | null;
  activeGenerationRunId: string | null;
  generationRunFailed: boolean;
  generationRunPaused: boolean;
  failedGenerationPipeline: GenerationPipeline | null;
  isPausingGeneration: boolean;
  isAbandoningGeneration: boolean;
  referenceMaterial: ReferenceMaterialOut | null;
  currentQuizId: string | null;
  generationProgress: GenerationProgressOut | null;
}
