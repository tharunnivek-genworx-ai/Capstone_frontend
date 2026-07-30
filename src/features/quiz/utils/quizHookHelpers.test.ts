import { describe, expect, it } from "vitest";
import { extractQuizErrorDetail, retainQuestionsWithIncompleteHints } from "./quizHookHelpers";
import {
  addGeneratingQuizNode,
  deleteGeneratingQuizNode,
  hasGeneratingQuizNode,
} from "./quizRunOwnership";

describe("quizHookHelpers", () => {
  it("extracts quiz error detail", () => {
    expect(extractQuizErrorDetail({ message: "x" })).toBe("x");
    expect(
      extractQuizErrorDetail({ response: { data: { detail: "nope" } } }),
    ).toBe("nope");
  });

  it("retains only questions missing a hint", () => {
    const quiz = {
      questions: [
        { question_id: "q1", hint_1: "a", hint_2: "b", hint_3: "c" },
        { question_id: "q2", hint_1: "a", hint_2: null, hint_3: "c" },
      ],
    } as never;
    expect(retainQuestionsWithIncompleteHints(["q1", "q2"], quiz)).toEqual(["q2"]);
  });
});

describe("quizRunOwnership", () => {
  it("tracks quiz generating ownership", () => {
    deleteGeneratingQuizNode("qz1");
    addGeneratingQuizNode("qz1");
    expect(hasGeneratingQuizNode("qz1")).toBe(true);
    deleteGeneratingQuizNode("qz1");
    expect(hasGeneratingQuizNode("qz1")).toBe(false);
  });
});
