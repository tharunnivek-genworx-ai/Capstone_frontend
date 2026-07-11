import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  StudyMaterialBatchDetailOut,
  StudyMaterialBatchEnqueueRequest,
  StudyMaterialBatchPreviewRequest,
  StudyMaterialBatchPreviewResponse,
  StudyMaterialSpaceQueueOut,
} from "../types/studyMaterialBatch.types";

/** Thin client for generate-all wizard. */
export const studyMaterialBatchService = {
  async preview(
    spaceId: string,
    payload: StudyMaterialBatchPreviewRequest,
  ): Promise<StudyMaterialBatchPreviewResponse> {
    const response = await studyAgentClient.post<StudyMaterialBatchPreviewResponse>(
      `/spaces/${spaceId}/study-material/generate-all/preview`,
      payload,
    );
    return response.data;
  },

  async enqueue(
    spaceId: string,
    payload: StudyMaterialBatchEnqueueRequest,
  ): Promise<StudyMaterialSpaceQueueOut> {
    // Persist-only endpoint — must stay fast (Cloud Run cold start ~few seconds).
    const response = await studyAgentClient.post<StudyMaterialSpaceQueueOut>(
      `/spaces/${spaceId}/study-material/generate-all/enqueue`,
      payload,
      { timeout: 20000 },
    );
    return response.data;
  },

  async getBatch(batchId: string): Promise<StudyMaterialBatchDetailOut> {
    const response = await studyAgentClient.get<StudyMaterialBatchDetailOut>(
      `/study-material-batches/${batchId}`,
    );
    return response.data;
  },

  /** Recovery / server-sequential: runs one full node inline, then returns. */
  async advance(spaceId: string): Promise<StudyMaterialSpaceQueueOut> {
    const response = await studyAgentClient.post<StudyMaterialSpaceQueueOut>(
      `/spaces/${spaceId}/study-material/generation-queue/advance`,
      undefined,
      { timeout: 600000 },
    );
    return response.data;
  },

  async getQueue(spaceId: string): Promise<StudyMaterialSpaceQueueOut> {
    const response = await studyAgentClient.get<StudyMaterialSpaceQueueOut>(
      `/spaces/${spaceId}/study-material/generation-queue`,
    );
    return response.data;
  },
};
