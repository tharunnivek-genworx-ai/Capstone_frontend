import studyAgentClient from "../../../lib/studyAgentClient";
import type {
  MentorSpaceProgressOut,
  MentorSpaceProgressSummaryOut,
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
};
