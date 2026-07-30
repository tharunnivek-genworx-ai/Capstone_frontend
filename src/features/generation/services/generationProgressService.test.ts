import { beforeEach, describe, expect, it, vi } from "vitest";

import studyAgentClient from "../../../lib/studyAgentClient";
import {
  generationJobService,
  generationProgressService,
} from "./generationProgressService";

vi.mock("../../../lib/studyAgentClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("generation progress request coalescing", () => {
  beforeEach(() => {
    vi.mocked(studyAgentClient.get).mockReset();
  });

  it("shares concurrent progress requests for the same run", async () => {
    let resolveRequest!: (value: { data: never }) => void;
    vi.mocked(studyAgentClient.get).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = generationProgressService.get("run-1");
    const second = generationProgressService.get("run-1");
    resolveRequest({
      data: {
        session_id: "run-1",
        pipeline: "study_material",
        status: "running",
        current_step_index: 0,
        steps: [],
      } as never,
    });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(studyAgentClient.get).toHaveBeenCalledTimes(1);
  });

  it("shares concurrent run-detail requests for the same run", async () => {
    let resolveRequest!: (value: { data: never }) => void;
    vi.mocked(studyAgentClient.get).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = generationJobService.getRun("run-2");
    const second = generationJobService.getRun("run-2");
    resolveRequest({ data: { run_id: "run-2", status: "running" } as never });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(studyAgentClient.get).toHaveBeenCalledTimes(1);
  });
});
