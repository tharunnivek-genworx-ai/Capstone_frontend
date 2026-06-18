import studyAgentClient from "../../../lib/studyAgentClient";
import type { TraineeNodePanelOut } from "../types/traineeNodePanel.types";

export const traineeNodePanelService = {
  async getPanel(nodeId: string): Promise<TraineeNodePanelOut> {
    const response = await studyAgentClient.get<TraineeNodePanelOut>(
      `/trainee/nodes/${nodeId}/panel`
    );
    return response.data;
  },
};
