import type {
  QuizHistoryItemOut,
  QuizMentorUiStateOut,
  QuizOut,
} from "../types/quiz.types";

export type QuizMentorUiSetters = {
  setQuizDraftExists: (v: boolean) => void;
  setCanGenerateQuiz: (v: boolean) => void;
  setGenerateDisabledTooltip: (v: string | null) => void;
  setCanAccessHints: (v: boolean) => void;
  setHintsLocked: (v: boolean) => void;
  setHintsLockedTooltip: (v: string | null) => void;
  setCanGenerateHints: (v: boolean) => void;
  setCanRegenerateHints: (v: boolean) => void;
  setCanPublishQuiz: (v: boolean) => void;
  setPublishDisabledTooltip: (v: string | null) => void;
  setPublishQuizButtonLabel: (v: string) => void;
  setUnpublishQuizButtonLabel: (v: string) => void;
  setHasOtherLiveQuiz: (v: boolean) => void;
  setOtherLiveQuizTitle: (v: string | null) => void;
  setCanEditQuestions: (v: boolean) => void;
  setCanRegenerateQuiz: (v: boolean) => void;
  setQuiz: (v: QuizOut | null) => void;
  setShowUpdateQuizNudge: (v: boolean) => void;
  setQuizSmVersionLabel: (v: string | null) => void;
  setQuizHistory: (v: QuizHistoryItemOut[]) => void;
};

export function applyQuizMentorUiState(
  state: QuizMentorUiStateOut,
  setters: QuizMentorUiSetters,
  options: { includeQuiz?: boolean } = {},
): void {
  setters.setQuizDraftExists(state.quiz_draft_exists);
  setters.setCanGenerateQuiz(state.can_generate_quiz);
  setters.setGenerateDisabledTooltip(state.generate_disabled_tooltip ?? null);
  setters.setCanAccessHints(state.can_access_hints);
  setters.setHintsLocked(state.hints_locked);
  setters.setHintsLockedTooltip(state.hints_locked_tooltip ?? null);
  setters.setCanGenerateHints(state.can_generate_hints);
  setters.setCanRegenerateHints(state.can_regenerate_hints);
  setters.setCanPublishQuiz(state.can_publish_quiz);
  setters.setPublishDisabledTooltip(state.publish_disabled_tooltip ?? null);
  setters.setPublishQuizButtonLabel(state.publish_quiz_button_label ?? "Make quiz live for students");
  setters.setUnpublishQuizButtonLabel(state.unpublish_quiz_button_label ?? "Remove quiz from students");
  setters.setHasOtherLiveQuiz(state.has_other_live_quiz ?? false);
  setters.setOtherLiveQuizTitle(state.other_live_quiz_title ?? null);
  setters.setCanEditQuestions(state.can_edit_questions);
  setters.setCanRegenerateQuiz(state.can_regenerate_quiz);
  setters.setShowUpdateQuizNudge(state.show_update_quiz_nudge ?? false);
  setters.setQuizSmVersionLabel(state.quiz_sm_version_label ?? null);
  setters.setQuizHistory(state.quiz_history ?? []);
  if (options.includeQuiz) {
    setters.setQuiz(state.resolved_quiz_id ? state.quiz ?? null : null);
  }
}
