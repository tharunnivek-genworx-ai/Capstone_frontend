import studyAgentClient from "../../../lib/studyAgentClient";
import type { GenerationProgressOut } from "../types/generationProgress.types";

export const generationProgressService = {
  async get(sessionId: string): Promise<GenerationProgressOut> {
    const response = await studyAgentClient.get<GenerationProgressOut>(
      `/generation-progress/${sessionId}`,
    );
    return response.data;
  },
};

export function createGenerationProgressSessionId(): string {
  return crypto.randomUUID();
}
