import { describe, expect, it } from "vitest";

import { shouldShowCodeQualityScore } from "./qcDisplayUtils";

describe("shouldShowCodeQualityScore", () => {
  it("shows code quality only for Programming domain", () => {
    expect(shouldShowCodeQualityScore("Programming")).toBe(true);
    expect(shouldShowCodeQualityScore("STEM")).toBe(false);
    expect(shouldShowCodeQualityScore("Conceptual")).toBe(false);
    expect(shouldShowCodeQualityScore("Mixed")).toBe(false);
  });
});
