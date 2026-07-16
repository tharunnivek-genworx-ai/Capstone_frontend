export interface FourOptionQuestionDraft {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export function isCompleteFourOptionQuestion(
  draft: FourOptionQuestionDraft,
): boolean {
  return (
    draft.questionText.trim().length >= 5
    && draft.optionA.trim().length > 0
    && draft.optionB.trim().length > 0
    && draft.optionC.trim().length > 0
    && draft.optionD.trim().length > 0
  );
}
