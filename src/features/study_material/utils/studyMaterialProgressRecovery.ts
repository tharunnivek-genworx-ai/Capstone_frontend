import type {
  StudyMaterialMentorUiStateOut,
  StudyMaterialVersionOut,
  StudyMaterialVersionSummary,
} from "../types/studyMaterial.types";
import {
  computeShouldShowHistoryHub,
  isHistoricalMentorSummary,
  isStudyMaterialProgressing,
  isWorkspaceDraftSummary,
  partitionHistoryVersions,
  type StudyMaterialProgressFlags,
} from "./versionHistoryPartitions";

/** Full version payload fields used to classify workspace vs history without a badge. */
export type VersionOutLayerFields = Pick<
  StudyMaterialVersionOut,
  "is_published" | "is_archived" | "published_at"
>;

/**
 * Mentor workspace draft from a full version row (no badge on VersionOut).
 * Matches unpublished WIP that was never published (`published_at` null).
 */
export function isWorkspaceDraftVersionOut(version: VersionOutLayerFields): boolean {
  return !version.is_published && !version.is_archived && version.published_at == null;
}

/**
 * Previous / Removed / shelf-like rows from a full version payload.
 * `published_at` set + not live ⇒ student history (Previous or Removed).
 */
export function isHistoricalVersionOut(version: VersionOutLayerFields): boolean {
  if (version.is_archived) return true;
  if (version.is_published) return false;
  return version.published_at != null;
}

export function findSummaryById(
  versionId: string,
  versionHistory: StudyMaterialVersionSummary[],
  archivedVersionHistory: StudyMaterialVersionSummary[],
): StudyMaterialVersionSummary | null {
  return (
    versionHistory.find((v) => v.version_id === versionId) ??
    archivedVersionHistory.find((v) => v.version_id === versionId) ??
    null
  );
}

/** True when `activeVersion` is a real "Your draft" (not Previous/Removed/live). */
export function activeVersionIsWorkspaceDraft(
  activeVersion: { version_id: string } | null | undefined,
  versionHistory: StudyMaterialVersionSummary[],
  archivedVersionHistory: StudyMaterialVersionSummary[],
): boolean {
  if (!activeVersion?.version_id) return false;
  const summary = findSummaryById(
    activeVersion.version_id,
    versionHistory,
    archivedVersionHistory,
  );
  if (summary) return isWorkspaceDraftSummary(summary);

  const partitions = partitionHistoryVersions(versionHistory, archivedVersionHistory);
  return partitions.workspaceDrafts.some(
    (v) => v.version_id === activeVersion.version_id,
  );
}

/**
 * Whether page-2 / selectNode getActiveVersion hydrate should become the
 * workspace `activeVersion` pointer. Historical Previous/Removed must not latch.
 */
export function shouldHydrateAsWorkspaceActiveVersion(
  version: { version_id: string } & Partial<VersionOutLayerFields>,
  versionHistory: StudyMaterialVersionSummary[],
  archivedVersionHistory: StudyMaterialVersionSummary[],
  mentorUiState: StudyMaterialMentorUiStateOut | null,
  options?: { isGeneratingOrProgressing?: boolean },
): boolean {
  if (options?.isGeneratingOrProgressing) return false;

  if (
    mentorUiState &&
    computeShouldShowHistoryHub(versionHistory, archivedVersionHistory, mentorUiState, {
      isGeneratingOrProgressing: options?.isGeneratingOrProgressing,
    })
  ) {
    return false;
  }

  const summary = findSummaryById(
    version.version_id,
    versionHistory,
    archivedVersionHistory,
  );
  if (summary) {
    if (isHistoricalMentorSummary(summary)) return false;
    if (isWorkspaceDraftSummary(summary)) return true;
    if (summary.is_published || summary.mentor_display_badge === "Live for students") {
      return true;
    }
    return false;
  }

  // Summaries not loaded yet — classify from VersionOut layer fields when present.
  if (
    version.published_at !== undefined ||
    version.is_published !== undefined ||
    version.is_archived !== undefined
  ) {
    const layer: VersionOutLayerFields = {
      is_published: Boolean(version.is_published),
      is_archived: Boolean(version.is_archived),
      published_at: version.published_at ?? null,
    };
    if (isHistoricalVersionOut(layer)) return false;
    if (layer.is_published) return true;
    return isWorkspaceDraftVersionOut(layer);
  }

  // Unknown — allow; backend clears is_active on unpublish so Previous-only is null.
  return true;
}

export interface ActiveRunRecoveryProbeDecision {
  /** Call getActiveRun and rehydrate Progress when running/paused/failed. */
  shouldProbe: boolean;
  /** Module Set still owns the node after study-state wipe — clear before probing. */
  clearModuleOwnership: boolean;
}

/**
 * Decide whether Material should probe getActiveRun for Progress rehydration.
 * Option A: always probe unless local Progress flags already cover the run, or the
 * module Set is actively waiting (isGenerating). After remount wipe, clear Set + probe.
 */
export function decideActiveRunRecoveryProbe(input: {
  moduleOwnsNode: boolean;
  localIsGenerating: boolean;
  generationRunPaused: boolean;
  generationRunFailed: boolean;
  failedGenerationPipeline: string | null;
}): ActiveRunRecoveryProbeDecision {
  const studyPausedOrFailed =
    (input.generationRunPaused || input.generationRunFailed) &&
    input.failedGenerationPipeline === "study_material";

  if (studyPausedOrFailed) {
    return { shouldProbe: false, clearModuleOwnership: false };
  }

  if (input.moduleOwnsNode && input.localIsGenerating) {
    return { shouldProbe: false, clearModuleOwnership: false };
  }

  if (input.moduleOwnsNode && !input.localIsGenerating) {
    return { shouldProbe: true, clearModuleOwnership: true };
  }

  return { shouldProbe: true, clearModuleOwnership: false };
}

/** Progress wins for any unresolved study-material run status. */
export function shouldApplyProgressFromActiveRun(
  status: string | null | undefined,
): boolean {
  return status === "running" || status === "paused" || status === "failed";
}

/**
 * Batch/selectNode patches must not force `isGenerating: false` while Progress
 * flags still indicate an active/paused/failed study-material run.
 */
export function preserveProgressFlagsInPatch<T extends StudyMaterialProgressFlags>(
  existing: StudyMaterialProgressFlags | null | undefined,
  patch: T,
): T {
  if (!existing || !isStudyMaterialProgressing(existing)) {
    return patch;
  }
  if (!("isGenerating" in patch)) {
    return patch;
  }
  const { isGenerating: _ignored, ...rest } = patch as T & { isGenerating?: boolean };
  return rest as T;
}
