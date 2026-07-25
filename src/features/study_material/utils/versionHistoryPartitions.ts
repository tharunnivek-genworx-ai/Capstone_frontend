import type { GenerationPipeline } from "../../generation/types/generationProgress.types";
import type {
  StudyMaterialMentorUiStateOut,
  StudyMaterialVersionSummary,
} from "../types/studyMaterial.types";

export interface HistoryVersionPartitions {
  studentArchive: StudyMaterialVersionSummary[];
  removedFromStudents: StudyMaterialVersionSummary[];
  mentorArchive: StudyMaterialVersionSummary[];
  workspaceDrafts: StudyMaterialVersionSummary[];
}

/** Mentor workspace draft layer — badge "Your draft". */
export function isWorkspaceDraftSummary(
  version: Pick<StudyMaterialVersionSummary, "mentor_display_badge">,
): boolean {
  return version.mentor_display_badge === "Your draft";
}

/** Previous / Removed / archive history layers (not workspace or live). */
export function isHistoricalMentorSummary(
  version: Pick<StudyMaterialVersionSummary, "mentor_display_badge" | "is_archived">,
): boolean {
  const badge = version.mentor_display_badge;
  return (
    badge === "Previous for students" ||
    badge === "In student archive" ||
    badge === "Removed from students" ||
    badge === "In your archive" ||
    version.is_archived
  );
}

/** Flags used to decide whether Material page 2 should show generation progress. */
export interface StudyMaterialProgressFlags {
  isGenerating?: boolean;
  isPausingGeneration?: boolean;
  generationRunPaused?: boolean;
  generationRunFailed?: boolean;
  failedGenerationPipeline?: GenerationPipeline | null;
}

/**
 * True when a study-material run is running, pausing, paused, or failed —
 * Progress should win over History hub / draft body.
 */
export function isStudyMaterialProgressing(
  flags: StudyMaterialProgressFlags,
): boolean {
  return (
    Boolean(flags.isGenerating) ||
    Boolean(flags.isPausingGeneration) ||
    ((Boolean(flags.generationRunPaused) || Boolean(flags.generationRunFailed)) &&
      flags.failedGenerationPipeline === "study_material")
  );
}

export function partitionHistoryVersions(
  versionHistory: StudyMaterialVersionSummary[],
  archivedVersionHistory: StudyMaterialVersionSummary[],
): HistoryVersionPartitions {
  const studentArchive: StudyMaterialVersionSummary[] = [];
  const removedFromStudents: StudyMaterialVersionSummary[] = [];
  const workspaceDrafts: StudyMaterialVersionSummary[] = [];

  for (const version of versionHistory) {
    switch (version.mentor_display_badge) {
      case "Previous for students":
      case "In student archive":
        studentArchive.push(version);
        break;
      case "Removed from students":
        removedFromStudents.push(version);
        break;
      case "Your draft":
        workspaceDrafts.push(version);
        break;
      default:
        break;
    }
  }

  for (const version of archivedVersionHistory) {
    if (isWorkspaceDraftSummary(version)) {
      workspaceDrafts.push(version);
    }
  }

  const mentorArchive = archivedVersionHistory.filter(
    (version) =>
      version.is_archived || version.mentor_display_badge === "In your archive",
  );

  return { studentArchive, removedFromStudents, mentorArchive, workspaceDrafts };
}

/** Whether selecting a version should silently activate it for editing. */
export function shouldSilentlyActivateOnSelect(
  summary: StudyMaterialVersionSummary | null | undefined,
): boolean {
  if (!summary || summary.is_active) return false;
  // Mentor shelf archives must be restored explicitly — activate() unarchives on the server.
  if (summary.is_archived) return false;
  // Preserve view-only when peeking at the live published version alongside another draft.
  if (summary.is_published) return false;
  return true;
}

export interface ComputeShouldShowHistoryHubOptions {
  /** When true (running / paused / failed SM run), Progress wins — hub stays off. */
  isGeneratingOrProgressing?: boolean;
}

export function computeShouldShowHistoryHub(
  versionHistory: StudyMaterialVersionSummary[],
  archivedVersionHistory: StudyMaterialVersionSummary[],
  mentorUiState: StudyMaterialMentorUiStateOut | null,
  options?: ComputeShouldShowHistoryHubOptions,
): boolean {
  if (options?.isGeneratingOrProgressing) {
    return false;
  }

  const partitions = partitionHistoryVersions(versionHistory, archivedVersionHistory);

  const hasLiveVersion = Boolean(mentorUiState?.published_version_id);
  // active_version_id can still point at a version after unpublish (Previous / Removed)
  // even though it is no longer a workspace draft — only count real "Your draft" rows.
  const hasActiveWorkingDraft = Boolean(
    mentorUiState?.active_version_id &&
      partitions.workspaceDrafts.some(
        (version) => version.version_id === mentorUiState.active_version_id,
      ),
  );
  const hasHistoricalVersions =
    partitions.studentArchive.length > 0 ||
    partitions.removedFromStudents.length > 0 ||
    partitions.mentorArchive.length > 0;

  return (
    !hasLiveVersion &&
    !hasActiveWorkingDraft &&
    partitions.workspaceDrafts.length === 0 &&
    hasHistoricalVersions
  );
}
