import { describe, expect, it } from "vitest";

import { formatQcScore } from "./llmDiagnostics";

describe("formatQcScore", () => {
  it("returns em dash for null and undefined", () => {
    expect(formatQcScore(null)).toBe("—");
    expect(formatQcScore(undefined)).toBe("—");
  });

  it("formats numeric scores as N/10", () => {
    expect(formatQcScore(0)).toBe("0/10");
    expect(formatQcScore(8)).toBe("8/10");
    expect(formatQcScore(10)).toBe("10/10");
  });
});
