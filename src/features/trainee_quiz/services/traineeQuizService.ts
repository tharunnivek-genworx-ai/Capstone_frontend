import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  PublishedQuizDiscoveryOut,
  QuizAttemptOut,
  QuizQuestionResponseOut,
  QuizQuestionResponseRequest,
  TraineeQuizAttemptListOut,
  TraineeQuizOut,
  TraineeArchivedQuizListOut,
  ArchivedQuizReviewOut,
  QuizAttemptStateOut,
  QuizAttemptStatePatch,
} from "../types/traineeQuiz.types";

export const traineeQuizService = {
  getPublishedQuizState(nodeId: string): Promise<PublishedQuizDiscoveryOut> {
    return studyAgentClient
      .get<PublishedQuizDiscoveryOut>(`/trainee/nodes/${nodeId}/quizzes/published`)
      .then((r) => r.data);
  },

  listAttempts(nodeId: string, quizId: string): Promise<TraineeQuizAttemptListOut> {
    return studyAgentClient
      .get<TraineeQuizAttemptListOut>(`/trainee/nodes/${nodeId}/quizzes/${quizId}/attempts`)
      .then((r) => r.data);
  },

  startAttempt(nodeId: string, quizId: string): Promise<TraineeQuizOut> {
    return studyAgentClient
      .post<TraineeQuizOut>(`/trainee/nodes/${nodeId}/quizzes/${quizId}/attempt`, {})
      .then((r) => r.data);
  },

  getAttempt(attemptId: string): Promise<TraineeQuizOut> {
    return studyAgentClient
      .get<TraineeQuizOut>(`/trainee/attempts/${attemptId}`)
      .then((r) => r.data);
  },

  submitResponse(
    attemptId: string,
    payload: QuizQuestionResponseRequest,
  ): Promise<QuizQuestionResponseOut> {
    return studyAgentClient
      .post<QuizQuestionResponseOut>(`/trainee/attempts/${attemptId}/response`, payload)
      .then((r) => r.data);
  },

  submitAttempt(attemptId: string): Promise<QuizAttemptOut> {
    return studyAgentClient
      .post<QuizAttemptOut>(`/trainee/attempts/${attemptId}/submit`, {})
      .then((r) => r.data);
  },

  patchAttemptState(
    attemptId: string,
    payload: QuizAttemptStatePatch,
  ): Promise<QuizAttemptStateOut> {
    return studyAgentClient
      .patch<QuizAttemptStateOut>(`/trainee/attempts/${attemptId}/state`, payload)
      .then((r) => r.data);
  },

  listArchivedQuizzes(nodeId: string): Promise<TraineeArchivedQuizListOut> {
    return studyAgentClient
      .get<TraineeArchivedQuizListOut>(`/trainee/nodes/${nodeId}/quizzes/archive`)
      .then((r) => r.data);
  },

  reviewArchivedQuiz(
    nodeId: string,
    quizId: string,
    attemptId?: string | null,
  ): Promise<ArchivedQuizReviewOut> {
    return studyAgentClient
      .get<ArchivedQuizReviewOut>(
        `/trainee/nodes/${nodeId}/quizzes/${quizId}/review`,
        { params: attemptId ? { attempt_id: attemptId } : undefined },
      )
      .then((r) => r.data);
  },
};
