export interface AbandonedAttemptTarget {
  nodeId: string;
  quizId: string;
}

export function parseAttemptError(
  err: unknown,
  fallback = "Quiz request failed.",
): {
  message: string;
  abandonedTarget: AbandonedAttemptTarget | null;
} {
  const e = err as {
    response?: {
      data?: {
        detail?: string | {
          error_code?: string;
          message?: string;
          node_id?: string;
          quiz_id?: string;
        };
      };
    };
    message?: string;
  };
  const detail = e?.response?.data?.detail;
  if (typeof detail === "object" && detail) {
    return {
      message: detail.message ?? fallback,
      abandonedTarget:
        detail.error_code === "ATTEMPT_ABANDONED" && detail.node_id && detail.quiz_id
          ? { nodeId: detail.node_id, quizId: detail.quiz_id }
          : null,
    };
  }
  return {
    message: typeof detail === "string" ? detail : e?.message ?? fallback,
    abandonedTarget: null,
  };
}
