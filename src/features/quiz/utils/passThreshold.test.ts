import { describe, expect, it } from "vitest";
import {
  DEFAULT_PASS_THRESHOLD_PERCENT,
  isValidPassThreshold,
} from "./passThreshold";

describe("pass threshold validation", () => {
  it("uses 70 percent by default", () => {
    expect(DEFAULT_PASS_THRESHOLD_PERCENT).toBe(70);
  });

  it.each([1, 70, 85, 100])("accepts %s", (value) => {
    expect(isValidPassThreshold(value)).toBe(true);
  });

  it.each([0, 101, 70.5, Number.NaN])("rejects %s", (value) => {
    expect(isValidPassThreshold(value)).toBe(false);
  });
});
