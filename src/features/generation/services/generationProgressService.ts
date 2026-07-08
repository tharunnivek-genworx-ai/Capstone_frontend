import studyAgentClient from "../../../lib/studyAgentClient";
import type { GenerationProgressOut } from "../types/generationProgress.types";
import type {
  GenerationJobStartResponse,
  GenerationRunResultOut,
} from "../types/generationJob.types";

const POLL_INTERVAL_MS = 1200;
const MAX_NOT_FOUND_RETRIES = 6;

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
  ): Promise<{ run_id: string; pipeline: string; status: string; step_profile?: string | null } | null> {
    const response = await studyAgentClient.get(
      "/generation-runs/active",
      { params: { resource_id: resourceId, pipeline } },
    );
    return response.data;
  },

  async getResult(runId: string): Promise<GenerationRunResultOut> {
    const response = await studyAgentClient.get<GenerationRunResultOut>(
      `/generation-runs/${runId}/result`,
    );
    return response.data;
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
        if (progress.status === "completed" || progress.status === "failed") {
          return progress;
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

  async runJob(
    start: () => Promise<GenerationJobStartResponse>,
    onProgress?: (progress: GenerationProgressOut) => void,
  ): Promise<{ runId: string; progress: GenerationProgressOut; result: GenerationRunResultOut }> {
    const started = await start();
    const progress = await this.waitForCompletion(started.run_id, onProgress);
    if (progress.status === "failed") {
      throw new Error(progress.error ?? "Generation failed.");
    }
    const result = await this.getResult(started.run_id);
    return { runId: started.run_id, progress, result };
  },
};
