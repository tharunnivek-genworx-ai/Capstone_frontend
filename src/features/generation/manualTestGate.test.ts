/**
 * Automated checks for Manual Test Gate 2 (Phase 2) — study material cancel/delete.
 * Maps 1:1 to plan scenarios; complements browser verification.
 */
import { describe, expect, it } from "vitest";

import type { GenerationProgressOut } from "./types/generationProgress.types";
import { resolveGenerationProgress } from "./hooks/useGenerationProgress";
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
  isResuming?: boolean;
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
    isResuming = false,
  } = input;

  const isUserPaused =
    !isResuming
    && (
      progressStatus === "paused"
      || Boolean(pausedRunId && onResume)
    );
  const isFailed =
    !isUserPaused
    && !isResuming
    && (progressStatus === "failed" || Boolean(failedRunId && onResume));
  const isRunning =
    isResuming
    || (!isUserPaused && !isFailed && progressStatus !== "completed");
  const showAbandon = Boolean(onAbandon && (isUserPaused || isFailed));
  const showPause = Boolean(isRunning && !isResuming && onPause && (canPause || isPausing));

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
    // After Cancel, pausedRunId wins over a briefly stale "running" poll.
    expect(stalePausedFlag.isUserPaused).toBe(true);
    expect(stalePausedFlag.showPause).toBe(false);
    expect(stalePausedFlag.showAbandon).toBe(true);

    const continuing = panelButtonVisibility({
      progressStatus: "paused",
      pausedRunId: RUN_ID,
      onPause: true,
      onResume: true,
      onAbandon: true,
      isResuming: true,
    });
    // While Continue is in flight, show live progress chrome immediately.
    expect(continuing.isUserPaused).toBe(false);
    expect(continuing.isRunning).toBe(true);
    expect(continuing.showAbandon).toBe(false);
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

describe("Generation progress — per-node checklist isolation", () => {
  const nodeAProgress: GenerationProgressOut = {
    session_id: "run-a",
    pipeline: "study_material",
    status: "running",
    current_step_index: 1,
    steps: [
      { id: "outline", label: "Outlining", status: "completed" },
      { id: "generate", label: "Generating", status: "active" },
      { id: "assess", label: "Assessing", status: "pending" },
    ],
  };
  const nodeBProgress: GenerationProgressOut = {
    session_id: "run-b",
    pipeline: "study_material",
    status: "running",
    current_step_index: 0,
    steps: [
      { id: "outline", label: "Outlining", status: "active" },
      { id: "generate", label: "Generating", status: "pending" },
      { id: "assess", label: "Assessing", status: "pending" },
    ],
  };
  const pausedSeed: GenerationProgressOut = {
    session_id: "run-a",
    pipeline: "study_material",
    status: "paused",
    current_step_index: 0,
    steps: [
      { id: "outline", label: "Outlining", status: "active" },
      { id: "generate", label: "Generating", status: "pending" },
      { id: "assess", label: "Assessing", status: "pending" },
    ],
  };

  it("uses seeded progress for the active session when poll cache is empty", () => {
    const resolved = resolveGenerationProgress(true, "run-a", null, nodeAProgress);
    expect(resolved?.steps[1]?.status).toBe("active");
  });

  it("does not show another node's seeded progress after switching topics", () => {
    const resolved = resolveGenerationProgress(true, "run-b", null, nodeAProgress);
    expect(resolved).toBeNull();
    const resolvedB = resolveGenerationProgress(true, "run-b", null, nodeBProgress);
    expect(resolvedB?.steps[0]?.status).toBe("active");
  });

  it("prefers live poll data over stale seed for the same session", () => {
    const polled: GenerationProgressOut = {
      ...nodeAProgress,
      current_step_index: 2,
      steps: [
        { id: "outline", label: "Outlining", status: "completed" },
        { id: "generate", label: "Generating", status: "completed" },
        { id: "assess", label: "Assessing", status: "active" },
      ],
    };
    const resolved = resolveGenerationProgress(
      true,
      "run-a",
      { sessionId: "run-a", progress: polled },
      nodeAProgress,
    );
    expect(resolved?.steps[2]?.status).toBe("active");
  });

  it("ignores paused/failed seed while a run is active (resume handshake)", () => {
    expect(resolveGenerationProgress(true, "run-a", null, pausedSeed, true)).toBeNull();
    const failedSeed: GenerationProgressOut = { ...pausedSeed, status: "failed" };
    expect(resolveGenerationProgress(true, "run-a", null, failedSeed, true)).toBeNull();
  });

  it("still shows paused seed on the paused screen when not suppressing", () => {
    expect(resolveGenerationProgress(true, "run-a", null, pausedSeed, false)?.status).toBe(
      "paused",
    );
  });

  it("ignores a stale paused poll cache while suppressing during resume", () => {
    expect(
      resolveGenerationProgress(
        true,
        "run-a",
        { sessionId: "run-a", progress: pausedSeed },
        null,
        true,
      ),
    ).toBeNull();
  });
});

describe("Generation progress — resume placeholder vs live checklist", () => {
  function resumePanelChrome(input: {
    isResuming?: boolean;
    progressStatus?: GenerationProgressOut["status"];
    stepCount?: number;
  }) {
    const { isResuming = false, progressStatus, stepCount = 3 } = input;
    const hasLiveRunningProgress = progressStatus === "running";
    const showResumePlaceholder = Boolean(isResuming && !hasLiveRunningProgress);
    const visibleStepCount = showResumePlaceholder ? 0 : stepCount;
    const displayTitle = showResumePlaceholder ? "Resuming…" : "Generating study material";
    return { showResumePlaceholder, visibleStepCount, displayTitle };
  }

  it("hides the checklist while Continue is recovering the run", () => {
    const view = resumePanelChrome({
      isResuming: true,
      progressStatus: "paused",
      stepCount: 3,
    });
    expect(view.showResumePlaceholder).toBe(true);
    expect(view.visibleStepCount).toBe(0);
    expect(view.displayTitle).toBe("Resuming…");
  });

  it("shows the normal checklist once live running progress arrives", () => {
    const view = resumePanelChrome({
      isResuming: false,
      progressStatus: "running",
      stepCount: 3,
    });
    expect(view.showResumePlaceholder).toBe(false);
    expect(view.visibleStepCount).toBe(3);
    expect(view.displayTitle).toBe("Generating study material");
  });
});
