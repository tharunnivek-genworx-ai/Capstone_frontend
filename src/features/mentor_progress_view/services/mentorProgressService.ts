import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  MentorSpaceProgressOut,
  MentorSpaceProgressSummaryOut,
  NodeDeletePreviewOut,
} from "../types/mentorProgress.types";

export const mentorProgressService = {
  async getSpaceProgress(spaceId: string): Promise<MentorSpaceProgressOut> {
    const response = await studyAgentClient.get<MentorSpaceProgressOut>(
      `/spaces/${spaceId}/progress`
    );
    return response.data;
  },

  async getSpaceProgressSummary(spaceId: string): Promise<MentorSpaceProgressSummaryOut> {
    const response = await studyAgentClient.get<MentorSpaceProgressSummaryOut>(
      `/spaces/${spaceId}/progress/summary`
    );
    return response.data;
  },

  async previewDeletedNodeContent(
    spaceId: string,
    nodeIds: string[]
  ): Promise<NodeDeletePreviewOut> {
    const response = await studyAgentClient.post<NodeDeletePreviewOut>(
      `/spaces/${spaceId}/nodes/delete-preview`,
      { node_ids: nodeIds }
    );
    return response.data;
  },

  async cascadeDeletedNodeContent(
    spaceId: string,
    nodeIds: string[]
  ): Promise<void> {
    await studyAgentClient.post(
      `/spaces/${spaceId}/nodes/delete-content-cascade`,
      { node_ids: nodeIds }
    );
  },

  async syncSpaceProgress(spaceId: string): Promise<void> {
    await studyAgentClient.post(`/spaces/${spaceId}/progress/recompute`);
  },
};
