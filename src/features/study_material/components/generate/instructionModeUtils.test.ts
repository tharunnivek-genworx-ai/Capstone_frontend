import { describe, expect, it } from "vitest";
import { applyDefaultFromMode, deriveInstructionMode, detectInstructionModeFromNode, isApproachDirty } from "./instructionModeUtils";

describe("instruction mode controls", () => {
  it("maps saved modes back to the section-default toggle", () => {
    expect(applyDefaultFromMode("inherit")).toBe(true);
    expect(applyDefaultFromMode("extend")).toBe(true);
    expect(applyDefaultFromMode("replace")).toBe(false);
  });

  it("inherits when the section default toggle is on and no topic note exists", () => {
    expect(deriveInstructionMode(true, "   ")).toBe("inherit");
  });

  it("replaces when the section default toggle is off, even without topic text", () => {
    expect(deriveInstructionMode(false, "")).toBe("replace");
  });

  it("detects empty replace overrides from saved node fields", () => {
    const node = {
      node_specific_instruction: "",
      node_additive_instruction: null,
    } as Parameters<typeof detectInstructionModeFromNode>[0];

    expect(detectInstructionModeFromNode(node)).toBe("replace");
    expect(isApproachDirty(node, "replace", "")).toBe(false);
    expect(isApproachDirty(node, "inherit", "")).toBe(true);
  });

  it("extends or replaces according to the section-default toggle", () => {
    expect(deriveInstructionMode(true, "Use a practical example")).toBe("extend");
    expect(deriveInstructionMode(false, "Teach this as a case study")).toBe("replace");
  });
});
