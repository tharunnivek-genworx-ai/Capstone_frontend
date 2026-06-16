/** User-facing message when quiz actions are blocked (Scenario G). */
export const LINKED_VERSION_UNPUBLISHED_MESSAGE =
  "To edit or publish this quiz, first re-publish the associated study material version.";

export interface QuizWarningInput {
  isLinkedVersionPublished: boolean;
  canPublishQuiz: boolean;
  publishBlockReason: string | null;
  generateBlockReason?: string | null;
  canGenerateQuiz?: boolean;
  hintsLocked?: boolean;
  hintsLockedReason?: string | null;
  canGenerateHints?: boolean;
  canRegenerateHints?: boolean;
  quizIsPublished?: boolean;
}

/**
 * Resolve the primary warning to show prominently (not only on hover).
 * Priority matches backend guard order: linked version → publish → hints → generate.
 */
export function resolveQuizActionWarning(input: QuizWarningInput): string | null {
  if (!input.isLinkedVersionPublished) {
    return LINKED_VERSION_UNPUBLISHED_MESSAGE;
  }

  if (!input.quizIsPublished && input.publishBlockReason && !input.canPublishQuiz) {
    return input.publishBlockReason;
  }

  if (
    input.hintsLocked &&
    input.hintsLockedReason &&
    (!input.canGenerateHints || !input.canRegenerateHints)
  ) {
    return input.hintsLockedReason;
  }

  if (input.canGenerateQuiz === false && input.generateBlockReason) {
    return input.generateBlockReason;
  }

  return null;
}
