// src/features/quiz/services/quizService.ts
import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  HintRegenerateRequest,
  QuizDeleteOut,
  QuizGenerateRequest,
  QuizMentorUiStateOut,
  QuizOut,
  QuizQuestionCreateRequest,
  QuizQuestionOut,
  QuizQuestionReorderRequest,
  QuizQuestionUpdateRequest,
} from "../types/quiz.types";

export const quizService = {
  generate(nodeId: string, payload: QuizGenerateRequest): Promise<QuizOut> {
    return studyAgentClient
      .post<QuizOut>(`/nodes/${nodeId}/quizzes/generate`, payload)
      .then((r) => r.data);
  },

  getMentorUiState(
    nodeId: string,
    options: { preferredQuizId?: string | null; includeQuiz?: boolean } = {},
  ): Promise<QuizMentorUiStateOut> {
    const params = new URLSearchParams();
    if (options.preferredQuizId) {
      params.set("preferred_quiz_id", options.preferredQuizId);
    }
    if (options.includeQuiz) {
      params.set("include_quiz", "true");
    }
    const query = params.toString();
    return studyAgentClient
      .get<QuizMentorUiStateOut>(
        `/nodes/${nodeId}/quizzes/mentor-ui-state${query ? `?${query}` : ""}`,
      )
      .then((r) => r.data);
  },

  publish(nodeId: string, quizId: string): Promise<QuizOut> {
    return studyAgentClient
      .patch<QuizOut>(`/nodes/${nodeId}/quizzes/${quizId}/publish`, {})
      .then((r) => r.data);
  },

  unpublish(nodeId: string, quizId: string): Promise<QuizOut> {
    return studyAgentClient
      .patch<QuizOut>(`/nodes/${nodeId}/quizzes/${quizId}/unpublish`, {})
      .then((r) => r.data);
  },

  deleteQuiz(nodeId: string, quizId: string): Promise<QuizDeleteOut> {
    return studyAgentClient
      .delete<QuizDeleteOut>(`/nodes/${nodeId}/quizzes/${quizId}`)
      .then((r) => r.data);
  },

  deleteHintsDraft(nodeId: string, quizId: string): Promise<QuizOut> {
    return studyAgentClient
      .delete<QuizOut>(`/nodes/${nodeId}/quizzes/${quizId}/hints`)
      .then((r) => r.data);
  },

  createQuestion(nodeId: string, quizId: string, payload: QuizQuestionCreateRequest): Promise<QuizQuestionOut> {
    return studyAgentClient
      .post<QuizQuestionOut>(`/nodes/${nodeId}/quizzes/${quizId}/questions`, payload)
      .then((r) => r.data);
  },

  updateQuestion(
    nodeId: string,
    quizId: string,
    questionId: string,
    payload: QuizQuestionUpdateRequest,
  ): Promise<QuizQuestionOut> {
    return studyAgentClient
      .patch<QuizQuestionOut>(`/nodes/${nodeId}/quizzes/${quizId}/questions/${questionId}`, payload)
      .then((r) => r.data);
  },

  deleteQuestion(nodeId: string, quizId: string, questionId: string): Promise<{ question_id: string; is_active: boolean }> {
    return studyAgentClient
      .delete<{ question_id: string; is_active: boolean }>(`/nodes/${nodeId}/quizzes/${quizId}/questions/${questionId}`)
      .then((r) => r.data);
  },

  reorderQuestions(nodeId: string, quizId: string, payload: QuizQuestionReorderRequest): Promise<{ detail: string }> {
    return studyAgentClient
      .patch<{ detail: string }>(`/nodes/${nodeId}/quizzes/${quizId}/questions/reorder`, payload)
      .then((r) => r.data);
  },

  generateHints(nodeId: string, quizId: string): Promise<QuizOut> {
    return studyAgentClient
      .post<QuizOut>(`/nodes/${nodeId}/quizzes/${quizId}/hints/generate`, {})
      .then((r) => r.data);
  },

  regenerateHints(nodeId: string, quizId: string, payload: HintRegenerateRequest): Promise<QuizOut> {
    return studyAgentClient
      .post<QuizOut>(`/nodes/${nodeId}/quizzes/${quizId}/hints/regenerate`, payload)
      .then((r) => r.data);
  },
};
