/** Pure builders for TopicPageNav disabled-tab tooltips (mentor node detail). */

export function getQuizDisabledTooltip(input: {
  canAccessQuiz: boolean;
  hasVersions: boolean | undefined;
  spaceIsPublished: boolean | undefined;
}): string {
  if (!input.canAccessQuiz) {
    if (!input.hasVersions) {
      return "Generate study material first";
    }
    if (input.spaceIsPublished === false) {
      return "Publish the space to access Quiz";
    }
    return "Generate study material first";
  }
  return "Generate study material first";
}

export function getHintsDisabledTooltip(input: {
  canAccessHints: boolean;
  quizDraftExists: boolean;
  hintsLockedTooltip?: string | null;
}): string {
  if (!input.canAccessHints && input.quizDraftExists) {
    return input.hintsLockedTooltip ?? "Quiz must be in an accessible state to view Hints";
  }
  return "Generate a quiz first";
}
