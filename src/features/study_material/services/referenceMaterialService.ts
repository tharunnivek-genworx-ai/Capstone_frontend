import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  NodeMediaListOut,
  NodeMediaOut,
  ReferenceImageListOut,
  ReferenceMaterialOut,
} from "../types/studyMaterial.types";
import { resolveStudyAgentMediaUrl } from "../utils/mediaUrl";

export type NodeMediaAttachType = "image" | "pdf" | "video_url" | "article_link";

export const referenceMaterialService = {
  materialFileUrl(material: ReferenceMaterialOut): string | null {
    return resolveStudyAgentMediaUrl(material.file_url);
  },

  mediaPublicUrl(media: NodeMediaOut): string | null {
    return resolveStudyAgentMediaUrl(media.public_url ?? media.file_url ?? media.url);
  },

  async uploadToNode(
    spaceId: string,
    nodeId: string,
    file: File,
    title: string,
    isVisibleToTrainees = false
  ): Promise<ReferenceMaterialOut> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("scope", "node");
    formData.append("node_id", nodeId);
    formData.append("is_visible_to_trainees", String(isVisibleToTrainees));

    const response = await studyAgentClient.post<ReferenceMaterialOut>(
      `/spaces/${spaceId}/reference-materials`,
      formData
    );
    return response.data;
  },

  async updateVisibility(
    materialId: string,
    isVisibleToTrainees: boolean
  ): Promise<ReferenceMaterialOut> {
    const response = await studyAgentClient.patch<ReferenceMaterialOut>(
      `/reference-materials/${materialId}/visibility`,
      { is_visible_to_trainees: isVisibleToTrainees }
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

  async listNodeMedia(nodeId: string): Promise<NodeMediaListOut> {
    const response = await studyAgentClient.get<NodeMediaListOut>(
      `/nodes/${nodeId}/media`
    );
    return response.data;
  },

  async attachNodeMediaFile(
    nodeId: string,
    mediaType: "image" | "pdf",
    file: File,
    title?: string
  ): Promise<NodeMediaOut> {
    const formData = new FormData();
    formData.append("media_type", mediaType);
    formData.append("file", file);
    if (title?.trim()) formData.append("title", title.trim());

    const response = await studyAgentClient.post<NodeMediaOut>(
      `/nodes/${nodeId}/media`,
      formData
    );
    return response.data;
  },

  async attachNodeMediaLink(
    nodeId: string,
    mediaType: "video_url" | "article_link",
    url: string,
    title?: string
  ): Promise<NodeMediaOut> {
    const formData = new FormData();
    formData.append("media_type", mediaType);
    formData.append("url", url.trim());
    if (title?.trim()) formData.append("title", title.trim());

    const response = await studyAgentClient.post<NodeMediaOut>(
      `/nodes/${nodeId}/media`,
      formData
    );
    return response.data;
  },

  async deleteNodeMedia(nodeId: string, mediaId: string): Promise<void> {
    await studyAgentClient.delete(`/nodes/${nodeId}/media/${mediaId}`);
  },

  async listReferenceImages(
    nodeId: string,
    materialId: string
  ): Promise<ReferenceImageListOut> {
    const response = await studyAgentClient.get<ReferenceImageListOut>(
      `/nodes/${nodeId}/media`,
      { params: { reference_material_id: materialId } }
    );
    return response.data;
  },
};
