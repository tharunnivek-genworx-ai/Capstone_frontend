// src/features/quiz/types/quiz.types.ts
import type {
  LlmErrorType,
  ProviderMetaOut,
  RetentionMode,
} from "../../study_material/types/studyMaterial.types";

export type { RetentionMode };

export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";
export type CorrectOption = "A" | "B" | "C" | "D";
export type QuestionSource = "ai_generated" | "mentor_manual";
export type HintsStatus = "none" | "partial" | "complete";

export interface QuizQuestionOut {
  question_id: string;
  quiz_id: string;
  node_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_option: CorrectOption;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  explanation: string | null;
  order_index: number;
  source: QuestionSource;
  is_active: boolean;
}

export interface QuizQualityCheckScoresOut {
  answer_correctness?: number | null;
  topic_relevance?: number | null;
  option_quality?: number | null;
  question_clarity?: number | null;
  difficulty_alignment?: number | null;
  explanation_quality?: number | null;
  duplicate_overlap?: number | null;
}

export interface QuizQualityCheckFlaggedQuestionOut {
  question_id: string;
  question_number: number;
  flags: string[];
}

export interface HintQuestionErrorOut {
  question_id: string;
  errorType: LlmErrorType;
  attempts: number;
}

export interface HintGenerationDiagnosticsOut {
  errorType?: LlmErrorType | null;
  questionErrors?: HintQuestionErrorOut[];
  retryAfterSeconds?: number | null;
  nextLlmRetryAt?: string | null;
}

export interface QuizQualityCheckResultOut {
  overall_status: "pass" | "warn" | "fail";
  wrong_answer_risk: "none" | "low" | "medium" | "high";
  scores: QuizQualityCheckScoresOut;
  flagged_questions?: QuizQualityCheckFlaggedQuestionOut[];
  issues?: string[];
  corrective_instructions?: string;
  summary?: string;
  errorType?: LlmErrorType | null;
  suggestion?: string | null;
  providerMeta?: ProviderMetaOut | null;
  qcInfraError?: boolean | null;
  retryAfterSeconds?: number | null;
  nextLlmRetryAt?: string | null;
  hintGeneration?: HintGenerationDiagnosticsOut | null;
  mentorDismissedQcWarning?: boolean | null;
}

export interface QuizOut {
  quiz_id: string;
  node_id: string;
  space_id: string;
  study_material_version_id: string | null;
  title: string;
  total_questions: number;
  difficulty: QuizDifficulty;
  is_published: boolean;
  published_at: string | null;
  pass_threshold_percent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  hints_status: HintsStatus;
  hints_stale_question_ids?: string[];
  questions: QuizQuestionOut[];
  qc_failed_permanently?: boolean;
  qc_result?: QuizQualityCheckResultOut | null;
  next_llm_retry_at?: string | null;
}

export interface QuizHistoryItemOut {
  quiz_id: string;
  title: string;
  status_badge: string;
  lifecycle_status: string;
  study_material_version_id: string | null;
  version_label: string;
  total_questions: number;
  difficulty: QuizDifficulty;
  published_at: string | null;
  can_view: boolean;
  can_delete: boolean;
}

export interface QuizMentorUiStateOut {
  node_id: string;
  resolved_quiz_id: string | null;
  quiz_draft_exists: boolean;
  quiz_history: QuizHistoryItemOut[];
  published_study_material_version_id: string | null;
  can_generate_quiz: boolean;
  generate_disabled_tooltip: string | null;
  can_access_hints: boolean;
  hints_locked: boolean;
  hints_locked_tooltip: string | null;
  can_generate_hints: boolean;
  can_regenerate_hints: boolean;
  can_publish_quiz: boolean;
  publish_disabled_tooltip: string | null;
  can_edit_questions: boolean;
  can_regenerate_quiz: boolean;
  quiz: QuizOut | null;
  show_update_quiz_nudge: boolean;
  quiz_sm_version_label: string | null;
  publish_quiz_button_label: string;
  unpublish_quiz_button_label: string;
  has_other_live_quiz: boolean;
  other_live_quiz_title: string | null;
}

export interface QuizGenerateRequest {
  difficulty?: QuizDifficulty;
  title?: string;
  question_count?: number;
  mode?: "generate" | "regenerate";
  quiz_id?: string;
  mentor_feedback?: string;
  resize_question_count?: boolean;
}

export interface QuizPublishRequest {
  pass_threshold_percent?: number;
}

export interface QuizPassThresholdUpdateRequest {
  pass_threshold_percent: number;
}

export interface QuizQuestionCreateRequest {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: CorrectOption;
  hint_1?: string | null;
  hint_2?: string | null;
  hint_3?: string | null;
  explanation?: string | null;
}

export interface QuizQuestionUpdateRequest {
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: CorrectOption;
  hint_1?: string | null;
  hint_2?: string | null;
  hint_3?: string | null;
  explanation?: string | null;
}

export interface QuizQuestionReorderRequest {
  question_ids: string[];
}

export interface QuizQuestionRegenerateRequest {
  question_ids: string[];
  mentor_feedback: string;
}

export interface HintRegenerateRequest {
  scope?: "all" | "selective";
  question_ids?: string[];
  mentor_feedback?: string;
}

export interface QuizDeleteOut {
  quiz_id: string;
  node_id: string;
  deleted: boolean;
}

export interface QuizQuestionDeletedOut {
  question_id: string;
  deleted: boolean;
  message: string;
}

export interface QuizUnpublishPreviewOut {
  requires_confirmation: boolean;
  quiz_title: string;
  trainees_attempt_count: number;
  version_label?: string | null;
}

export interface QuizUnpublishRequest {
  retention_mode: RetentionMode;
}
