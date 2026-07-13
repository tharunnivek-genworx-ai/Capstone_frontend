import studyAgentClient from "../../../lib/studyAgentClient";
import type { GenerationProgressOut } from "../types/generationProgress.types";
import type {
  GenerationJobStartResponse,
  GenerationRunActiveOut,
  GenerationRunOut,
  GenerationRunResultOut,
} from "../types/generationJob.types";
import { GenerationJobFailedError } from "../utils/generationJobErrors";

const POLL_INTERVAL_MS = 1200;
const MAX_NOT_FOUND_RETRIES = 6;
const ACTIVE_RUN_CLEAR_MAX_ATTEMPTS = 40;
const ACTIVE_RUN_CLEAR_INTERVAL_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isNotFoundError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404;
}

export const generationProgressService = {
  async get(sessionId: string): Promise<GenerationProgressOut> {
    const response = await studyAgentClient.get<GenerationProgressOut>(
      `/generation-progress/${sessionId}`,
    );
    return response.data;
  },
};

export const generationJobService = {
  async getActiveRun(
    resourceId: string,
    pipeline: string,
  ): Promise<GenerationRunActiveOut | null> {
    const response = await studyAgentClient.get<GenerationRunActiveOut | null>(
      "/generation-runs/active",
      { params: { resource_id: resourceId, pipeline } },
    );
    return response.data;
  },

  async getRun(runId: string): Promise<GenerationRunOut> {
    const response = await studyAgentClient.get<GenerationRunOut>(
      `/generation-runs/${runId}`,
    );
    return response.data;
  },

  async getResult(runId: string): Promise<GenerationRunResultOut> {
    const response = await studyAgentClient.get<GenerationRunResultOut>(
      `/generation-runs/${runId}/result`,
    );
    return response.data;
  },

  async resumeRun(runId: string): Promise<{ run_id: string }> {
    const response = await studyAgentClient.post<{ run_id: string }>(
      `/generation-runs/${runId}/resume`,
    );
    return response.data;
  },

  async pauseRun(runId: string): Promise<GenerationRunOut> {
    const response = await studyAgentClient.post<GenerationRunOut>(
      `/generation-runs/${runId}/pause`,
    );
    return response.data;
  },

  async abandonRun(runId: string): Promise<GenerationRunOut> {
    const response = await studyAgentClient.post<GenerationRunOut>(
      `/generation-runs/${runId}/abandon`,
    );
    return response.data;
  },

  async resumeJob(
    runId: string,
    onProgress?: (progress: GenerationProgressOut) => void,
  ): Promise<{ runId: string; progress: GenerationProgressOut; result: GenerationRunResultOut }> {
    await this.resumeRun(runId);
    const progress = await this.waitForCompletion(runId, onProgress);
    if (progress.status === "failed") {
      throw new GenerationJobFailedError(progress.error ?? "Generation failed.", runId);
    }
    const result = await this.getResult(runId);
    return { runId, progress, result };
  },

  async waitForCompletion(
    runId: string,
    onProgress?: (progress: GenerationProgressOut) => void,
  ): Promise<GenerationProgressOut> {
    let notFoundRetries = 0;

    while (true) {
      try {
        const progress = await generationProgressService.get(runId);
        notFoundRetries = 0;
        onProgress?.(progress);
        if (
          progress.status === "completed"
          || progress.status === "failed"
          || progress.status === "paused"
        ) {
          return progress;
        }

        // Progress polling can lag behind the durable run row — reconcile.
        try {
          const run = await this.getRun(runId);
          if (run.status === "completed") {
            return { ...progress, status: "completed" };
          }
          if (run.status === "paused") {
            return { ...progress, status: "paused" };
          }
          if (run.status === "failed" || run.status === "abandoned" || run.status === "cancelled") {
            return {
              ...progress,
              status: "failed",
              error: progress.error ?? run.error_message ?? "Generation failed.",
            };
          }
        } catch {
          // Keep polling progress when run metadata is temporarily unavailable.
        }
      } catch (error) {
        if (isNotFoundError(error) && notFoundRetries < MAX_NOT_FOUND_RETRIES) {
          notFoundRetries += 1;
        } else {
          throw error;
        }
      }
      await sleep(POLL_INTERVAL_MS);
    }
  },

  async waitForPaused(
    runId: string,
    onProgress?: (progress: GenerationProgressOut) => void,
  ): Promise<GenerationProgressOut> {
    while (true) {
      const progress = await generationProgressService.get(runId);
      onProgress?.(progress);
      if (progress.status === "paused") {
        return progress;
      }
      if (progress.status === "completed" || progress.status === "failed") {
        return progress;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  },

  /** Wait until no study-material run is active for this node (lock released server-side). */
  async waitForResourceIdle(
    resourceId: string,
    pipeline = "study_material",
  ): Promise<void> {
    for (let attempt = 0; attempt < ACTIVE_RUN_CLEAR_MAX_ATTEMPTS; attempt += 1) {
      const active = await this.getActiveRun(resourceId, pipeline);
      if (!active?.run_id) {
        return;
      }
      await sleep(ACTIVE_RUN_CLEAR_INTERVAL_MS);
    }
  },

  async runJob(
    start: () => Promise<GenerationJobStartResponse>,
    onProgress?: (progress: GenerationProgressOut) => void,
  ): Promise<{ runId: string; progress: GenerationProgressOut; result: GenerationRunResultOut }> {
    const started = await start();
    const progress = await this.waitForCompletion(started.run_id, onProgress);
    if (progress.status === "paused") {
      return { runId: started.run_id, progress, result: null as unknown as GenerationRunResultOut };
    }
    if (progress.status === "failed") {
      throw new GenerationJobFailedError(
        progress.error ?? "Generation failed.",
        started.run_id,
      );
    }
    const result = await this.getResult(started.run_id);
    return { runId: started.run_id, progress, result };
  },
};
