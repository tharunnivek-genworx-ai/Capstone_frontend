import type { StudyMaterialVersionSummary } from "../types/studyMaterial.types";

/** Panel / archive UI flags when a mentor selects a version from history. */
export function resolveVersionSelectPanelFlags(
  summary: StudyMaterialVersionSummary | null | undefined,
): {
  showArchivedPanel: boolean | null;
  expandStudentArchive: boolean;
} {
  if (summary?.is_archived) {
    return { showArchivedPanel: true, expandStudentArchive: false };
  }
  if (summary?.mentor_display_badge === "Previous for students") {
    return { showArchivedPanel: false, expandStudentArchive: true };
  }
  return { showArchivedPanel: null, expandStudentArchive: false };
}
