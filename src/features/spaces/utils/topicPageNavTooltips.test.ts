import { describe, expect, it } from "vitest";

import { getHintsDisabledTooltip, getQuizDisabledTooltip } from "./topicPageNavTooltips";

describe("getQuizDisabledTooltip", () => {
  it("asks to generate study material when no versions exist", () => {
    expect(
      getQuizDisabledTooltip({
        canAccessQuiz: false,
        hasVersions: false,
        spaceIsPublished: true,
      }),
    ).toBe("Generate study material first");
  });

  it("asks to publish when versions exist but space is unpublished", () => {
    expect(
      getQuizDisabledTooltip({
        canAccessQuiz: false,
        hasVersions: true,
        spaceIsPublished: false,
      }),
    ).toBe("Publish the space to access Quiz");
  });

  it("falls back to generate study material when versions exist and published", () => {
    expect(
      getQuizDisabledTooltip({
        canAccessQuiz: false,
        hasVersions: true,
        spaceIsPublished: true,
      }),
    ).toBe("Generate study material first");
  });

  it("returns generate study material when quiz is already accessible", () => {
    expect(
      getQuizDisabledTooltip({
        canAccessQuiz: true,
        hasVersions: true,
        spaceIsPublished: true,
      }),
    ).toBe("Generate study material first");
  });
});

describe("getHintsDisabledTooltip", () => {
  it("uses hintsLockedTooltip when a quiz draft exists but hints are locked", () => {
    expect(
      getHintsDisabledTooltip({
        canAccessHints: false,
        quizDraftExists: true,
        hintsLockedTooltip: "Custom lock reason",
      }),
    ).toBe("Custom lock reason");
  });

  it("falls back when quiz draft exists and hintsLockedTooltip is missing", () => {
    expect(
      getHintsDisabledTooltip({
        canAccessHints: false,
        quizDraftExists: true,
        hintsLockedTooltip: null,
      }),
    ).toBe("Quiz must be in an accessible state to view Hints");
  });

  it("asks to generate a quiz when no draft exists", () => {
    expect(
      getHintsDisabledTooltip({
        canAccessHints: false,
        quizDraftExists: false,
      }),
    ).toBe("Generate a quiz first");
  });

  it("asks to generate a quiz when hints are already accessible", () => {
    expect(
      getHintsDisabledTooltip({
        canAccessHints: true,
        quizDraftExists: true,
        hintsLockedTooltip: "unused",
      }),
    ).toBe("Generate a quiz first");
  });
});
