/** Types matching study_agent_service quiz_schema trainee-facing schemas. */

export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";
export type QuizAttemptStatus = "in_progress" | "submitted" | "abandoned";
export type CorrectOption = "A" | "B" | "C" | "D";
export type QuestionNavStatus = "notVisited" | "visited" | "answered" | "skipped";

export interface PublishedQuizDiscoveryOut {
  quiz_id: string | null;
  title: string | null;
  difficulty: QuizDifficulty | null;
  total_questions: number | null;
  has_in_progress_attempt: boolean;
  active_attempt_id: string | null;
  submitted_attempt_count: number;
  can_start_new_attempt: boolean;
  can_view_previous_attempts: boolean;
  is_review_only?: boolean;
  review_notice?: string | null;
}

export interface TraineeQuizQuestionOut {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  is_active: boolean;
  order_index: number;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  hint_level_reached: number;
  was_skipped: boolean;
  is_flagged: boolean;
  was_locked: boolean;
  selected_option: CorrectOption | null;
  is_correct: boolean | null;
  correct_option: CorrectOption | null;
  explanation: string | null;
  nav_status: QuestionNavStatus;
  can_answer: boolean;
  can_skip: boolean;
}

export interface TraineeQuizOut {
  quiz_id: string;
  node_id: string;
  title: string;
  difficulty: QuizDifficulty;
  total_questions: number;
  attempt_id: string;
  attempt_status: QuizAttemptStatus;
  started_at: string;
  resume_question_id: string | null;
  score_percent: number | null;
  pass_threshold_percent: number;
  best_score_percent: number | null;
  has_met_pass_threshold: boolean;
  total_correct: number | null;
  total_skipped: number | null;
  questions: TraineeQuizQuestionOut[];
}

export interface TraineeQuizAttemptSummaryOut {
  attempt_id: string;
  status: QuizAttemptStatus;
  score: number | null;
  score_percent: number | null;
  total_correct: number | null;
  total_skipped: number | null;
  total_questions: number;
  started_at: string;
  submitted_at: string | null;
  attempt_label: string;
}

export interface TraineeQuizAttemptListOut {
  quiz_id: string;
  node_id: string;
  title: string;
  attempts: TraineeQuizAttemptSummaryOut[];
}

export interface QuizQuestionResponseRequest {
  question_id: string;
  selected_option?: CorrectOption | null;
}

export interface QuizAttemptStatePatch {
  question_id: string;
  is_visited?: boolean;
  is_flagged?: boolean;
  was_skipped?: boolean;
  resume_question_id?: string;
}

export interface QuizAttemptStateOut {
  attempt_id: string;
  question_id: string;
  is_visited: boolean;
  is_flagged: boolean;
  was_skipped: boolean;
  resume_question_id: string | null;
}

export interface QuizQuestionResponseOut {
  response_id: string;
  attempt_id: string;
  question_id: string;
  selected_option: CorrectOption | null;
  is_correct: boolean | null;
  hint_level_reached: number;
  was_skipped: boolean;
  was_locked: boolean;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  next_question_id: string | null;
  resume_question_id: string | null;
}

export interface QuizAttemptOut {
  attempt_id: string;
  quiz_id: string;
  node_id: string;
  space_id: string;
  trainee_id: string;
  status: QuizAttemptStatus;
  score: number | null;
  total_correct: number | null;
  total_with_hints: number | null;
  total_skipped: number | null;
  started_at: string;
  submitted_at: string | null;
  newly_unlocked_node_ids: string[];
}

export interface QuestionState {
  id: string;
  status: QuestionNavStatus;
  isFlagged: boolean;
  selectedOption: CorrectOption | null;
  lastSubmissionCorrect: boolean | null;
  hintLevelUnlocked: number;
  hintsExpanded: boolean;
  visibleHintCount: number;
  wasLocked: boolean;
  wasSkipped: boolean;
  isActive: boolean;
  orderIndex: number;
  canAnswer: boolean;
  canSkip: boolean;
}

export interface TraineeArchivedQuizItem {
  quiz_id: string;
  study_material_version_id: string | null;
  title: string;
  difficulty: QuizDifficulty;
  total_questions: number;
  published_at: string | null;
  has_trainee_attempt: boolean;
  best_score_percent: number | null;
}

export interface TraineeArchivedQuizGroup {
  study_material_version_id: string | null;
  version_number: number;
  version_label: string;
  quizzes: TraineeArchivedQuizItem[];
}

export interface TraineeArchivedQuizListOut {
  node_id: string;
  groups: TraineeArchivedQuizGroup[];
}

export interface ArchivedQuizReviewOut {
  quiz_id: string;
  node_id: string;
  title: string;
  difficulty: QuizDifficulty;
  total_questions: number;
  study_material_version_id: string | null;
  version_label: string;
  is_archived_reference: boolean;
  attempt_id: string | null;
  attempt_status: QuizAttemptStatus | null;
  is_partial_attempt: boolean;
  score_percent: number | null;
  total_correct: number | null;
  total_skipped: number | null;
  questions: TraineeQuizQuestionOut[];
}
