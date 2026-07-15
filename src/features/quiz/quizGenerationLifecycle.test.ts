import { describe, expect, it } from "vitest";

import {
  patchForGenerationJobAbandoned,
  patchForGenerationJobPaused,
  patchForGenerationJobSuccess,
} from "../generation/utils/generationRunState";

const RUN_ID = "11111111-1111-1111-1111-111111111111";

describe("quiz and hint generation lifecycle state", () => {
  it.each(["quiz", "hint"] as const)(
    "keeps a paused %s run resumable without marking it failed",
    (pipeline) => {
      const patch = patchForGenerationJobPaused(RUN_ID, pipeline);

      expect(patch.generationRunPaused).toBe(true);
      expect(patch.generationRunFailed).toBe(false);
      expect(patch.failedGenerationPipeline).toBe(pipeline);
      expect(patch.activeGenerationRunId).toBe(RUN_ID);
      expect(patch.isGeneratingQuiz).toBe(false);
      expect(patch.isGeneratingHints).toBe(false);
    },
  );

  it("clears run ownership after completion or abandon", () => {
    for (const patch of [
      patchForGenerationJobSuccess(),
      patchForGenerationJobAbandoned(),
    ]) {
      expect(patch.generationRunPaused).toBe(false);
      expect(patch.generationRunFailed).toBe(false);
      expect(patch.activeGenerationRunId).toBeNull();
      expect(patch.generationProgressSessionId).toBeNull();
    }
  });
});
