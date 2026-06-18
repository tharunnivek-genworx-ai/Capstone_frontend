import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  TraineeStudyMaterialOut,
  StudyMaterialProgressUpdateRequest,
  StudyMaterialProgressOut,
} from "../types/traineeStudyMaterial.types";

export const traineeStudyMaterialService = {
  /** Trainee: fetch published study material for a node. */
  async getPublished(nodeId: string): Promise<TraineeStudyMaterialOut> {
    const response = await studyAgentClient.get<TraineeStudyMaterialOut>(
      `/trainee/nodes/${nodeId}/study-material`
    );
    return response.data;
  },

  /** Trainee: download published study material as PDF. */
  async downloadPublishedPdf(nodeId: string, filename: string): Promise<void> {
    const response = await studyAgentClient.get<Blob>(
      `/trainee/nodes/${nodeId}/study-material/pdf`,
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
      `/trainee/nodes/${nodeId}/study-material/progress`,
      payload
    );
    return response.data;
  },
};
