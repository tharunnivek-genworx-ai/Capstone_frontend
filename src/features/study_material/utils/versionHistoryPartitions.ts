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
    if (version.mentor_display_badge === "Your draft") {
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

export function computeShouldShowHistoryHub(
  versionHistory: StudyMaterialVersionSummary[],
  archivedVersionHistory: StudyMaterialVersionSummary[],
  mentorUiState: StudyMaterialMentorUiStateOut | null,
): boolean {
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
