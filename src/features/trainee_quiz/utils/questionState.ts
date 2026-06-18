import type { QuestionState, TraineeQuizQuestionOut } from "../types/traineeQuiz.types";

export function buildQuestionState(
  question: TraineeQuizQuestionOut,
  flagged = false,
): QuestionState {
  const hintLevel = question.hint_level_reached;

  return {
    id: question.question_id,
    status: question.nav_status,
    isFlagged: flagged,
    selectedOption: question.selected_option,
    lastSubmissionCorrect: question.is_correct,
    hintLevelUnlocked: hintLevel,
    hintsExpanded: hintLevel > 0 && question.is_correct === false,
    visibleHintCount: hintLevel > 0 ? Math.min(hintLevel, 3) : 0,
    wasLocked: question.was_locked,
    wasSkipped: question.was_skipped,
    isActive: question.is_active,
    orderIndex: question.order_index,
    canAnswer: question.can_answer,
    canSkip: question.can_skip,
  };
}

export function getHintTexts(question: TraineeQuizQuestionOut, count: number): string[] {
  const hints: string[] = [];
  if (count >= 1 && question.hint_1) hints.push(question.hint_1);
  if (count >= 2 && question.hint_2) hints.push(question.hint_2);
  if (count >= 3 && question.hint_3) hints.push(question.hint_3);
  return hints;
}

export function getOptions(question: TraineeQuizQuestionOut): Array<{ letter: string; text: string }> {
  const opts: Array<{ letter: string; text: string }> = [
    { letter: "A", text: question.option_a },
    { letter: "B", text: question.option_b },
  ];
  if (question.option_c) opts.push({ letter: "C", text: question.option_c });
  if (question.option_d) opts.push({ letter: "D", text: question.option_d });
  return opts;
}
