import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  BatchCancelResponse,
  BatchCreateRequest,
  BatchCreateResponse,
  BatchDetailOut,
  BatchPreviewRequest,
  BatchPreviewResponse,
  ExistingMaterialPolicy,
} from "../types/studyMaterialBatch.types";

function toBatchPolicy(policy: ExistingMaterialPolicy) {
  return {
    mode: policy === "skip" ? "skip_existing" : "regenerate_all",
  } as const;
}

/** Thin client for poll-only generate-all batch jobs. */
export const studyMaterialBatchService = {
  async preview(
    spaceId: string,
    payload: BatchPreviewRequest,
  ): Promise<BatchPreviewResponse> {
    const response = await studyAgentClient.post<BatchPreviewResponse>(
      `/spaces/${spaceId}/batches/preview`,
      payload,
    );
    return response.data;
  },

  async createBatch(
    spaceId: string,
    payload: {
      root_node_ids: string[];
      node_ids: string[];
      policy: ExistingMaterialPolicy;
    },
  ): Promise<BatchCreateResponse> {
    const body: BatchCreateRequest = {
      root_node_ids: payload.root_node_ids,
      node_ids: payload.node_ids,
      policy: toBatchPolicy(payload.policy),
    };
    const response = await studyAgentClient.post<BatchCreateResponse>(
      `/spaces/${spaceId}/batches`,
      body,
      { timeout: 20000 },
    );
    return response.data;
  },

  async getBatch(batchId: string): Promise<BatchDetailOut> {
    const response = await studyAgentClient.get<BatchDetailOut>(
      `/batches/${batchId}`,
    );
    return response.data;
  },

  async cancelBatch(batchId: string): Promise<BatchCancelResponse> {
    const response = await studyAgentClient.post<BatchCancelResponse>(
      `/batches/${batchId}/cancel`,
    );
    return response.data;
  },

  async getActiveBatch(spaceId: string): Promise<BatchDetailOut | null> {
    const response = await studyAgentClient.get<BatchDetailOut | null>(
      `/spaces/${spaceId}/batches/active`,
    );
    return response.data;
  },
};
