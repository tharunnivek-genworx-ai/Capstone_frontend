import type {
  StudyMaterialMentorUiStateOut,
  StudyMaterialVersionSummary,
} from "../types/studyMaterial.types";

/**
 * Shared Phase 0 B2 parity fixtures for History Hub eligibility.
 * Backend Phase 2 `show_history_hub` must match `eligible` for every case.
 * Progress override stays client-only and is asserted separately in FE tests.
 */
export function makeHistoryHubVersion(
  overrides: Partial<StudyMaterialVersionSummary> & Pick<StudyMaterialVersionSummary, "version_id">,
): StudyMaterialVersionSummary {
  return {
    version_number: 1,
    generation_type: "generate",
    based_on_version_id: null,
    based_on_version_number: null,
    lineage_chain: [],
    mentor_feedback_preview: null,
    reference_material_id: null,
    is_active: false,
    is_published: false,
    is_archived: false,
    archived_at: null,
    published_at: null,
    lifecycle_status: "draft",
    mentor_display_badge: "Your draft",
    student_visibility_hint: null,
    created_at: "2026-01-01T12:00:00Z",
    display_label: "v1",
    ...overrides,
  };
}

export function makeHistoryHubMentorUiState(
  overrides: Partial<StudyMaterialMentorUiStateOut> = {},
): StudyMaterialMentorUiStateOut {
  return {
    node_id: "node-1",
    has_versions: true,
    show_history_hub: false,
    active_version_id: null,
    published_version_id: null,
    can_access_study_material: true,
    can_access_quiz: false,
    instruction_changed_since_generation: false,
    current_effective_instruction: "",
    generation_instruction_snapshot: null,
    displayed_version_actions: null,
    student_visibility: {
      live_material_label: null,
      live_material_version_id: null,
      previous_version_count: 0,
      previous_version_labels: [],
      live_quiz_title: null,
    },
    ...overrides,
  };
}

export interface HistoryHubParityFixture {
  /** Stable case id for FE ↔ BE parity (Phase 2). */
  id: string;
  name: string;
  versionHistory: StudyMaterialVersionSummary[];
  archivedVersionHistory: StudyMaterialVersionSummary[];
  mentorUiState: StudyMaterialMentorUiStateOut;
  /** Server-eligible hub flag (Progress override is client-only). */
  eligible: boolean;
}

export const HISTORY_HUB_PARITY_FIXTURES: HistoryHubParityFixture[] = [
  {
    id: "empty",
    name: "empty",
    versionHistory: [],
    archivedVersionHistory: [],
    mentorUiState: makeHistoryHubMentorUiState({
      has_versions: false,
      show_history_hub: false,
    }),
    eligible: false,
  },
  {
    id: "live_only",
    name: "live only",
    versionHistory: [
      makeHistoryHubVersion({
        version_id: "live-1",
        mentor_display_badge: "Live for students",
        is_published: true,
      }),
    ],
    archivedVersionHistory: [],
    mentorUiState: makeHistoryHubMentorUiState({
      published_version_id: "live-1",
      show_history_hub: false,
    }),
    eligible: false,
  },
  {
    id: "workspace_draft_present",
    name: "workspace draft plus history",
    versionHistory: [
      makeHistoryHubVersion({ version_id: "draft-1", mentor_display_badge: "Your draft" }),
      makeHistoryHubVersion({
        version_id: "previous-1",
        mentor_display_badge: "Previous for students",
      }),
    ],
    archivedVersionHistory: [],
    mentorUiState: makeHistoryHubMentorUiState({
      active_version_id: "draft-1",
      show_history_hub: false,
    }),
    eligible: false,
  },
  {
    id: "previous_only",
    name: "previous for students only",
    versionHistory: [
      makeHistoryHubVersion({
        version_id: "previous-1",
        mentor_display_badge: "Previous for students",
      }),
    ],
    archivedVersionHistory: [],
    mentorUiState: makeHistoryHubMentorUiState({ show_history_hub: true }),
    eligible: true,
  },
  {
    id: "removed_only",
    name: "removed from students only",
    versionHistory: [
      makeHistoryHubVersion({
        version_id: "removed-1",
        mentor_display_badge: "Removed from students",
      }),
    ],
    archivedVersionHistory: [],
    mentorUiState: makeHistoryHubMentorUiState({ show_history_hub: true }),
    eligible: true,
  },
  {
    id: "mentor_archive_only",
    name: "mentor archive only",
    versionHistory: [],
    archivedVersionHistory: [
      makeHistoryHubVersion({
        version_id: "archive-1",
        mentor_display_badge: "In your archive",
        is_archived: true,
      }),
    ],
    mentorUiState: makeHistoryHubMentorUiState({ show_history_hub: true }),
    eligible: true,
  },
  {
    id: "stale_active_previous",
    name: "stale active id points at Previous",
    versionHistory: [
      makeHistoryHubVersion({
        version_id: "previous-1",
        mentor_display_badge: "Previous for students",
        is_active: true,
      }),
    ],
    archivedVersionHistory: [],
    mentorUiState: makeHistoryHubMentorUiState({
      active_version_id: "previous-1",
      show_history_hub: true,
    }),
    eligible: true,
  },
];
