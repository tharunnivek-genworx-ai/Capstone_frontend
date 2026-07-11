export class GenerationJobFailedError extends Error {
  readonly runId: string;

  constructor(message: string, runId: string) {
    super(message);
    this.name = "GenerationJobFailedError";
    this.runId = runId;
  }
}

export function getGenerationJobFailedRunId(error: unknown): string | null {
  if (error instanceof GenerationJobFailedError && error.runId) {
    return error.runId;
  }
  if (error && typeof error === "object" && "runId" in error) {
    const runId = (error as { runId?: unknown }).runId;
    if (typeof runId === "string" && runId.trim()) {
      return runId;
    }
  }
  return null;
}

export function extractResumeErrorDetail(error: unknown): string {
  const response = error as {
    response?: { status?: number; data?: { detail?: string | { message?: string } } };
    message?: string;
  };
  const status = response.response?.status;
  const detail = response.response?.data?.detail;
  if (status === 429) {
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && detail.message) {
      return detail.message;
    }
    return "Resume is temporarily rate-limited. Please try again shortly.";
  }
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && detail.message) {
    return detail.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Generation failed.";
}
