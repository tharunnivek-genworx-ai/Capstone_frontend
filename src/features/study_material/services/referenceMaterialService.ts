import studyAgentClient from "../../../lib/studyAgentClient";
import type { NodeMediaListOut, ReferenceMaterialOut } from "../types/studyMaterial.types";

export const referenceMaterialService = {
  async uploadToNode(
    spaceId: string,
    nodeId: string,
    file: File,
    title: string
  ): Promise<ReferenceMaterialOut> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("scope", "node");
    formData.append("node_id", nodeId);
    formData.append("is_visible_to_trainees", "true");

    const response = await studyAgentClient.post<ReferenceMaterialOut>(
      `/spaces/${spaceId}/reference-materials`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  async getLatestByNode(nodeId: string): Promise<ReferenceMaterialOut | null> {
    const response = await studyAgentClient.get<ReferenceMaterialOut | null>(
      `/nodes/${nodeId}/reference-materials/latest`
    );
    return response.data;
  },

  async delete(materialId: string): Promise<void> {
    await studyAgentClient.delete(`/reference-materials/${materialId}`);
  },

  async listNodeMedia(
    nodeId: string,
    referenceMaterialId?: string | null
  ): Promise<NodeMediaListOut> {
    const params = referenceMaterialId
      ? { reference_material_id: referenceMaterialId }
      : undefined;
    const response = await studyAgentClient.get<NodeMediaListOut>(
      `/nodes/${nodeId}/media`,
      { params }
    );
    return response.data;
  },
};
