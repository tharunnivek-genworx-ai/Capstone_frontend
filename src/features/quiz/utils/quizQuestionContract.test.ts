import { describe, expect, it } from "vitest";

import { isCompleteFourOptionQuestion } from "./quizQuestionContract";

const completeQuestion = {
  questionText: "Which option is correct?",
  optionA: "Alpha",
  optionB: "Beta",
  optionC: "Gamma",
  optionD: "Delta",
};

describe("quiz question API contract", () => {
  it("accepts a question only when all four options are present", () => {
    expect(isCompleteFourOptionQuestion(completeQuestion)).toBe(true);

    for (const key of ["optionA", "optionB", "optionC", "optionD"] as const) {
      expect(
        isCompleteFourOptionQuestion({
          ...completeQuestion,
          [key]: "   ",
        }),
      ).toBe(false);
    }
  });

  it("enforces the backend minimum question length after trimming", () => {
    expect(
      isCompleteFourOptionQuestion({
        ...completeQuestion,
        questionText: "  four  ",
      }),
    ).toBe(false);
  });
});
