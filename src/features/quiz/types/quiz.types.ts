// src/features/quiz/types/quiz.types.ts

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

export interface QuizQualityCheckResultOut {
  overall_status: "pass" | "warn" | "fail";
  wrong_answer_risk: "none" | "low" | "medium" | "high";
  scores: QuizQualityCheckScoresOut;
  flagged_questions?: QuizQualityCheckFlaggedQuestionOut[];
  issues?: string[];
  corrective_instructions?: string;
  summary?: string;
}

export interface QuizOut {
  quiz_id: string;
  node_id: string;
  space_id: string;
  study_material_version_id: string;
  title: string;
  total_questions: number;
  difficulty: QuizDifficulty;
  is_published: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  hints_status: HintsStatus;
  questions: QuizQuestionOut[];
  qc_failed_permanently?: boolean;
  qc_result?: QuizQualityCheckResultOut | null;
}

export interface QuizMentorUiStateOut {
  node_id: string;
  resolved_quiz_id: string | null;
  quiz_draft_exists: boolean;
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
  edit_question_disabled_tooltip: string | null;
  regenerate_quiz_disabled_tooltip: string | null;
  quiz: QuizOut | null;
  is_linked_version_published: boolean;
  is_stale_version: boolean;
  linked_version_label: string | null;
  current_published_version_label: string | null;
  stale_helper_text: string | null;
  generate_new_quiz_cta_label: string | null;
  quiz_title_with_version: string | null;
}

export interface QuizGenerateRequest {
  study_material_version_id?: string;
  difficulty?: QuizDifficulty;
  title?: string;
  question_count?: number;
  mode?: "generate" | "regenerate";
  quiz_id?: string;
  mentor_feedback?: string;
}

export interface QuizQuestionCreateRequest {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c?: string | null;
  option_d?: string | null;
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
  option_c?: string | null;
  option_d?: string | null;
  correct_option?: CorrectOption;
  hint_1?: string | null;
  hint_2?: string | null;
  hint_3?: string | null;
  explanation?: string | null;
}

export interface QuizQuestionReorderRequest {
  question_ids: string[];
}

export interface HintRegenerateRequest {
  question_ids: string[];
  mentor_feedback?: string;
}

export interface QuizDeleteOut {
  quiz_id: string;
  node_id: string;
  deleted: boolean;
}
