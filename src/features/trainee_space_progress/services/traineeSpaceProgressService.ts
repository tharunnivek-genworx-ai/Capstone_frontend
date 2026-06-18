import studyAgentClient from "../../../lib/studyAgentClient";
import type { TraineeOwnSpaceProgressOut } from "../types/traineeSpaceProgress.types";

export const traineeSpaceProgressService = {
  async getOwnSpaceProgress(spaceId: string): Promise<TraineeOwnSpaceProgressOut> {
    const response = await studyAgentClient.get<TraineeOwnSpaceProgressOut>(
      `/trainee/spaces/${spaceId}/progress`,
    );
    return response.data;
  },
};

