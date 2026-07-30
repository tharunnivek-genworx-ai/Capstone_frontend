import type { QuizOut } from "../types/quiz.types";

export function extractQuizErrorDetail(err: unknown): string {
  const e = err as {
    response?: { data?: string | { detail?: string | { message?: string } } };
    message?: string;
  };
  const data = e?.response?.data;
  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.detail === "object" && data.detail?.message) return data.detail.message;
  return e?.message ?? "Request failed.";
}

export function retainQuestionsWithIncompleteHints(
  questionIds: string[],
  quiz: QuizOut,
): string[] {
  return questionIds.filter((questionId) => {
    const question = quiz.questions.find((item) => item.question_id === questionId);
    return !question?.hint_1 || !question.hint_2 || !question.hint_3;
  });
}
