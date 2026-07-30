import { describe, expect, it } from "vitest";
import {
  addGeneratingNode,
  clearStudyMaterialModuleOwnership,
  deleteGeneratingNode,
  hasGeneratingNode,
  hasRecoveringRun,
  addRecoveringRun,
  deleteRecoveringRun,
} from "./studyMaterialRunOwnership";

describe("studyMaterialRunOwnership", () => {
  it("tracks generating and recovering ids and clears both on space wipe", () => {
    clearStudyMaterialModuleOwnership();
    addGeneratingNode("n1");
    addRecoveringRun("n2");
    expect(hasGeneratingNode("n1")).toBe(true);
    expect(hasRecoveringRun("n2")).toBe(true);

    deleteGeneratingNode("n1");
    deleteRecoveringRun("n2");
    expect(hasGeneratingNode("n1")).toBe(false);
    expect(hasRecoveringRun("n2")).toBe(false);

    addGeneratingNode("n3");
    addRecoveringRun("n3");
    clearStudyMaterialModuleOwnership();
    expect(hasGeneratingNode("n3")).toBe(false);
    expect(hasRecoveringRun("n3")).toBe(false);
  });
});
