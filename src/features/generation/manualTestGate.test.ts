/**
 * Automated checks for Manual Test Gate 2 (Phase 2) — study material cancel/delete.
 * Maps 1:1 to plan scenarios; complements browser verification.
 */
import { describe, expect, it } from "vitest";

import type { GenerationProgressOut } from "./types/generationProgress.types";
import { extractResumeErrorDetail } from "./utils/generationJobErrors";
import {
  patchForGenerationJobAbandoned,
  patchForGenerationJobFailure,
  patchForGenerationJobPaused,
  patchForGenerationJobStart,
  patchForGenerationJobSuccess,
} from "./utils/generationRunState";

const RUN_ID = "11111111-1111-1111-1111-111111111111";

function panelButtonVisibility(input: {
  progressStatus?: GenerationProgressOut["status"];
  pausedRunId?: string | null;
  failedRunId?: string | null;
  onPause?: boolean;
  onResume?: boolean;
  onAbandon?: boolean;
  canPause?: boolean;
  isPausing?: boolean;
}) {
  const {
    progressStatus,
    pausedRunId = null,
    failedRunId = null,
    onPause = false,
    onResume = false,
    onAbandon = false,
    canPause = false,
    isPausing = false,
  } = input;

  const isUserPaused =
    progressStatus === "paused"
    || Boolean(pausedRunId && onResume && progressStatus !== "running");
  const isFailed =
    !isUserPaused
    && (progressStatus === "failed" || Boolean(failedRunId && onResume));
  const isRunning =
    !isUserPaused && !isFailed && progressStatus !== "completed";
  const showAbandon = Boolean(onAbandon && (isUserPaused || isFailed));
  const showPause = Boolean(isRunning && onPause && (canPause || isPausing));

  return { showPause, showAbandon, isUserPaused, isRunning };
}

describe("Manual test gate — scenario 1: Cancel on step 2 → pause modal, stay page 2", () => {
  it("paused patch keeps page-2 state and clears isGenerating", () => {
    const patch = patchForGenerationJobPaused(RUN_ID, "study_material");
    expect(patch.isGenerating).toBe(false);
    expect(patch.generationRunPaused).toBe(true);
    expect(patch.generationRunFailed).toBe(false);
    expect(patch.activeGenerationRunId).toBe(RUN_ID);
  });

  it("progress panel shows Continue/Delete only when paused, not Cancel", () => {
    const running = panelButtonVisibility({
      progressStatus: "running",
      onPause: true,
      onResume: true,
      onAbandon: true,
      canPause: true,
    });
    expect(running.showPause).toBe(true);
    expect(running.showAbandon).toBe(false);

    const paused = panelButtonVisibility({
      progressStatus: "paused",
      pausedRunId: RUN_ID,
      onPause: true,
      onResume: true,
      onAbandon: true,
    });
    expect(paused.showPause).toBe(false);
    expect(paused.showAbandon).toBe(true);
    expect(paused.isUserPaused).toBe(true);

    const stalePausedFlag = panelButtonVisibility({
      progressStatus: "running",
      pausedRunId: RUN_ID,
      onPause: true,
      onResume: true,
      onAbandon: true,
      canPause: true,
    });
    expect(stalePausedFlag.isUserPaused).toBe(false);
    expect(stalePausedFlag.showPause).toBe(true);
  });
});

describe("Manual test gate — scenario 2: Continue after pause completes successfully", () => {
  it("success patch clears paused and failed flags", () => {
    const patch = patchForGenerationJobSuccess();
    expect(patch.generationRunPaused).toBe(false);
    expect(patch.generationRunFailed).toBe(false);
    expect(patch.isGenerating).toBe(false);
    expect(patch.activeGenerationRunId).toBeNull();
  });
});

describe("Manual test gate — scenario 3: Cancel → Delete run → no orphan draft", () => {
  it("abandon patch clears run ids so reload does not treat run as active", () => {
    const patch = patchForGenerationJobAbandoned();
    expect(patch.generationRunPaused).toBe(false);
    expect(patch.generationRunFailed).toBe(false);
    expect(patch.activeGenerationRunId).toBeNull();
    expect(patch.generationProgressSessionId).toBeNull();
  });
});

describe("Manual test gate — scenario 4: completed-during-cancel is success, not pause", () => {
  it("paused and failed patches are mutually exclusive", () => {
    const paused = patchForGenerationJobPaused(RUN_ID, "study_material");
    const failed = patchForGenerationJobFailure(
      new Error("fail"),
      RUN_ID,
      "study_material",
    );
    expect(paused.generationRunPaused).toBe(true);
    expect(paused.generationRunFailed).toBe(false);
    expect(failed.generationRunFailed).toBe(true);
    expect(failed.generationRunPaused).toBe(false);
  });

  it("success patch after completed-during-cancel clears pause UI state", () => {
    const afterSuccess = {
      ...patchForGenerationJobPaused(RUN_ID, "study_material"),
      ...patchForGenerationJobSuccess(),
    };
    expect(afterSuccess.generationRunPaused).toBe(false);
    expect(afterSuccess.isGenerating).toBe(false);
    expect(afterSuccess.activeGenerationRunId).toBeNull();
  });
});

describe("Manual test gate — scenario 5: changed reference blocks resume with 409", () => {
  it("extractResumeErrorDetail surfaces 409 conflict message", () => {
    const detail =
      "Reference or generation settings changed since this run was paused. "
      + "Delete this run and start a new generation.";
    const message = extractResumeErrorDetail({
      response: { status: 409, data: { detail } },
    });
    expect(message).toBe(detail);
  });
});

describe("Manual test gate — scenario 6: regenerate after cancel does not stick on Starting…", () => {
  it("job start patch clears stale pause/abandon flags", () => {
    const patch = patchForGenerationJobStart();
    expect(patch.generationRunPaused).toBe(false);
    expect(patch.generationRunFailed).toBe(false);
    expect(patch.isPausingGeneration).toBe(false);
    expect(patch.isAbandoningGeneration).toBe(false);
  });

  it("running state shows Cancel, not abandon, while isPausing is false", () => {
    const view = panelButtonVisibility({
      progressStatus: undefined,
      onPause: true,
      onAbandon: true,
      canPause: true,
    });
    expect(view.isRunning).toBe(true);
    expect(view.showPause).toBe(true);
    expect(view.showAbandon).toBe(false);
  });
});
