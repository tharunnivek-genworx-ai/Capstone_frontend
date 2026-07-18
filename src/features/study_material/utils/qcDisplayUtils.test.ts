import { describe, expect, it } from "vitest";

import {
  shouldShowCodeQualityScore,
  shouldShowQcWarning,
} from "./qcDisplayUtils";

describe("shouldShowCodeQualityScore", () => {
  it("shows code quality only for Programming domain", () => {
    expect(shouldShowCodeQualityScore("Programming")).toBe(true);
    expect(shouldShowCodeQualityScore("STEM")).toBe(false);
    expect(shouldShowCodeQualityScore("Conceptual")).toBe(false);
    expect(shouldShowCodeQualityScore("Mixed")).toBe(false);
  });
});

describe("shouldShowQcWarning", () => {
  it("hides placement-only structural failures after max attempts", () => {
    expect(
      shouldShowQcWarning(true, {
        failed_checks: [
          {
            id: "det_equation_in_content",
            passed: false,
            evidence: "An equation appears in prose.",
            corrective_hint: "Move it to a formula block.",
          },
          {
            id: "det_code_in_formula_block",
            passed: false,
            evidence: "Code appears in a formula block.",
          },
        ],
        corrective_instructions: "Correct the block placement.",
      }),
    ).toBe(false);
  });

  it("shows mixed or substantive failures when a diagnostic is present", () => {
    expect(
      shouldShowQcWarning(true, {
        failed_checks: [
          { id: "det_equation_in_content", passed: false },
          {
            id: "det_structure_coverage",
            passed: false,
            evidence: "The planned summary section is missing.",
          },
        ],
      }),
    ).toBe(true);
  });

  it("hides an empty QC failure payload", () => {
    expect(
      shouldShowQcWarning(true, {
        corrective_instructions: "   ",
        issues: [],
        summary: "",
        failed_checks: [
          {
            id: "content_accuracy",
            passed: false,
            evidence: "",
            corrective_hint: " ",
          },
        ],
      }),
    ).toBe(false);
  });

  it("shows warning-presentation and quiz question messages", () => {
    expect(
      shouldShowQcWarning(true, {
        warning_presentation: {
          evidence_items: [{ user_message: "A derivation step is missing." }],
        },
      }),
    ).toBe(true);
    expect(
      shouldShowQcWarning(true, {
        flagged_questions: [{ flags: ["The correct answer is ambiguous."] }],
      }),
    ).toBe(true);
  });

  it("preserves LLM diagnostics and the rate-limit dismissal behavior", () => {
    expect(
      shouldShowQcWarning(true, {
        errorType: "llm_infra_error",
      }),
    ).toBe(true);
    expect(
      shouldShowQcWarning(true, {
        errorType: "rate_limited",
        mentorDismissedQcWarning: true,
      }),
    ).toBe(true);
  });

  it("honors dismissal for non-rate-limit warnings", () => {
    expect(
      shouldShowQcWarning(true, {
        issues: ["Review this answer."],
        mentorDismissedQcWarning: true,
      }),
    ).toBe(false);
  });
});
