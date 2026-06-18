import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  PublishedQuizDiscoveryOut,
  QuizAttemptOut,
  QuizQuestionResponseOut,
  QuizQuestionResponseRequest,
  TraineeQuizAttemptListOut,
  TraineeQuizOut,
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
};
