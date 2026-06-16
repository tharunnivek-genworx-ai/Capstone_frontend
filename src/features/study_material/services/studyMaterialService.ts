import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  StudyMaterialActivateRequest,
  StudyMaterialClearDraftsEligibilityOut,
  StudyMaterialClearDraftsOut,
  StudyMaterialFeedbackResponse,
  StudyMaterialGenerateRequest,
  StudyMaterialImproveRequest,
  StudyMaterialManualEditRequest,
  StudyMaterialPublishRequest,
  StudyMaterialRegenerateRequest,
  StudyMaterialVersionHistoryOut,
  StudyMaterialVersionOut,
  StudyMaterialMentorUiStateOut,
  TraineeStudyMaterialOut,
  StudyMaterialProgressUpdateRequest,
  StudyMaterialProgressOut,
} from "../types/studyMaterial.types";
import type { SpaceRepublishChecklistOut } from "../../spaces/types/space.types";

export const studyMaterialService = {
  async generate(
    nodeId: string,
    payload: StudyMaterialGenerateRequest
  ): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.post<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/generate`,
      payload
    );
    return response.data;
  },

  async regenerate(
    nodeId: string,
    payload: StudyMaterialRegenerateRequest
  ): Promise<StudyMaterialFeedbackResponse> {
    const response = await studyAgentClient.post<StudyMaterialFeedbackResponse>(
      `/nodes/${nodeId}/study-material/regenerate`,
      payload
    );
    return response.data;
  },

  async improve(
    nodeId: string,
    payload: StudyMaterialImproveRequest
  ): Promise<StudyMaterialFeedbackResponse> {
    const response = await studyAgentClient.post<StudyMaterialFeedbackResponse>(
      `/nodes/${nodeId}/study-material/improve`,
      payload
    );
    return response.data;
  },

  async manualEdit(
    nodeId: string,
    payload: StudyMaterialManualEditRequest
  ): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.patch<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/manual-edit`,
      payload
    );
    return response.data;
  },

  async previewPublish(
    nodeId: string,
    versionId: string
  ): Promise<import("../types/studyMaterial.types").StudyMaterialPublishPreviewOut> {
    const response = await studyAgentClient.get(
      `/nodes/${nodeId}/study-material/publish-preview`,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  async publish(
    nodeId: string,
    payload: StudyMaterialPublishRequest
  ): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.patch<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/publish`,
      payload
    );
    return response.data;
  },

  async previewUnpublish(
    nodeId: string,
    versionId: string
  ): Promise<import("../types/studyMaterial.types").StudyMaterialUnpublishPreviewOut> {
    const response = await studyAgentClient.get(
      `/nodes/${nodeId}/study-material/unpublish-preview`,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  async unpublish(
    nodeId: string,
    payload: StudyMaterialPublishRequest
  ): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.patch<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/unpublish`,
      payload
    );
    return response.data;
  },

  async activate(
    nodeId: string,
    payload: StudyMaterialActivateRequest
  ): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.patch<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/activate`,
      payload
    );
    return response.data;
  },

  async listVersions(
    nodeId: string,
    options?: { archived?: boolean }
  ): Promise<StudyMaterialVersionHistoryOut> {
    const response = await studyAgentClient.get<StudyMaterialVersionHistoryOut>(
      `/nodes/${nodeId}/study-material/versions`,
      { params: { archived: options?.archived ?? false } }
    );
    return response.data;
  },

  async archive(nodeId: string, versionId: string): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.patch<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/versions/${versionId}/archive`
    );
    return response.data;
  },

  async unarchive(nodeId: string, versionId: string): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.patch<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/versions/${versionId}/unarchive`
    );
    return response.data;
  },

  async getVersion(
    nodeId: string,
    versionId: string
  ): Promise<StudyMaterialVersionOut> {
    const response = await studyAgentClient.get<StudyMaterialVersionOut>(
      `/nodes/${nodeId}/study-material/versions/${versionId}`
    );
    return response.data;
  },

  /** Load the current active version for a node, if any. */
  async getActiveVersion(
    nodeId: string
  ): Promise<StudyMaterialVersionOut | null> {
    const response = await studyAgentClient.get<StudyMaterialVersionOut | null>(
      `/nodes/${nodeId}/study-material/active`
    );
    return response.data;
  },

  async getMentorUiState(
    nodeId: string,
    viewingVersionId?: string | null
  ): Promise<StudyMaterialMentorUiStateOut> {
    const response = await studyAgentClient.get<StudyMaterialMentorUiStateOut>(
      `/nodes/${nodeId}/study-material/mentor-ui-state`,
      {
        params: viewingVersionId ? { viewing_version_id: viewingVersionId } : undefined,
      }
    );
    return response.data;
  },

  async getClearDraftsEligibility(
    nodeId: string
  ): Promise<StudyMaterialClearDraftsEligibilityOut> {
    const response = await studyAgentClient.get<StudyMaterialClearDraftsEligibilityOut>(
      `/nodes/${nodeId}/study-material/drafts/delete-eligibility`
    );
    return response.data;
  },

  async clearAllDrafts(nodeId: string): Promise<StudyMaterialClearDraftsOut> {
    const response = await studyAgentClient.delete<StudyMaterialClearDraftsOut>(
      `/nodes/${nodeId}/study-material/drafts`
    );
    return response.data;
  },

  /** Trainee: fetch published study material for a node. */
  async getPublished(nodeId: string): Promise<TraineeStudyMaterialOut> {
    const response = await studyAgentClient.get<TraineeStudyMaterialOut>(
      `/nodes/${nodeId}/study-material`
    );
    return response.data;
  },

  /** Trainee: download published study material as PDF. */
  async downloadPublishedPdf(nodeId: string, filename: string): Promise<void> {
    const response = await studyAgentClient.get<Blob>(
      `/nodes/${nodeId}/study-material/pdf`,
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /** Trainee: report scroll read progress (backend keeps max value). */
  async updateProgress(
    nodeId: string,
    payload: StudyMaterialProgressUpdateRequest
  ): Promise<StudyMaterialProgressOut> {
    const response = await studyAgentClient.patch<StudyMaterialProgressOut>(
      `/nodes/${nodeId}/study-material/progress`,
      payload
    );
    return response.data;
  },

  async getPublishedResources(spaceId: string): Promise<{
    space_id: string;
    published_topics: Array<{
      node_id: string;
      topic_title: string;
      published_study_material_version_id: string | null;
      published_quiz_id: string | null;
    }>;
  }> {
    const response = await studyAgentClient.get(
      `/spaces/${spaceId}/published-resources`
    );
    return response.data;
  },

  async getRepublishChecklist(spaceId: string): Promise<SpaceRepublishChecklistOut> {
    const response = await studyAgentClient.get<SpaceRepublishChecklistOut>(
      `/spaces/${spaceId}/republish-checklist`
    );
    return response.data;
  },
};
