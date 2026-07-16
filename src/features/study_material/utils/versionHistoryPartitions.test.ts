import { describe, expect, it } from "vitest";

import type {
  StudyMaterialMentorUiStateOut,
  StudyMaterialVersionSummary,
} from "../types/studyMaterial.types";
import {
  computeShouldShowHistoryHub,
  partitionHistoryVersions,
  shouldSilentlyActivateOnSelect,
} from "./versionHistoryPartitions";

function makeVersion(
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

function makeMentorUiState(
  overrides: Partial<StudyMaterialMentorUiStateOut> = {},
): StudyMaterialMentorUiStateOut {
  return {
    node_id: "node-1",
    has_versions: true,
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

describe("partitionHistoryVersions", () => {
  it("buckets versions into student archive, removed, mentor archive, and workspace drafts", () => {
    const versionHistory = [
      makeVersion({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
        display_label: "v10",
      }),
      makeVersion({
        version_id: "student-archive-1",
        mentor_display_badge: "In student archive",
        display_label: "v9",
      }),
      makeVersion({
        version_id: "removed-1",
        mentor_display_badge: "Removed from students",
        display_label: "v11",
      }),
      makeVersion({
        version_id: "draft-1",
        mentor_display_badge: "Your draft",
        display_label: "v12",
      }),
      makeVersion({
        version_id: "live-1",
        mentor_display_badge: "Live for students",
        display_label: "v13",
        is_published: true,
      }),
    ];
    const archivedVersionHistory = [
      makeVersion({
        version_id: "archived-1",
        mentor_display_badge: "In your archive",
        is_archived: true,
        display_label: "v8",
      }),
    ];

    const partitions = partitionHistoryVersions(versionHistory, archivedVersionHistory);

    expect(partitions.studentArchive.map((v) => v.version_id)).toEqual([
      "prev-1",
      "student-archive-1",
    ]);
    expect(partitions.removedFromStudents.map((v) => v.version_id)).toEqual(["removed-1"]);
    expect(partitions.mentorArchive.map((v) => v.version_id)).toEqual(["archived-1"]);
    expect(partitions.workspaceDrafts.map((v) => v.version_id)).toEqual(["draft-1"]);
  });

  it("includes archived workspace drafts in workspaceDrafts", () => {
    const archivedVersionHistory = [
      makeVersion({
        version_id: "archived-draft",
        mentor_display_badge: "Your draft",
        is_archived: true,
      }),
    ];

    const partitions = partitionHistoryVersions([], archivedVersionHistory);

    expect(partitions.workspaceDrafts.map((v) => v.version_id)).toEqual(["archived-draft"]);
    expect(partitions.mentorArchive.map((v) => v.version_id)).toEqual(["archived-draft"]);
  });
});

describe("computeShouldShowHistoryHub", () => {
  it("shows hub when there is no live version, no active draft, and one archived version", () => {
    const archivedVersionHistory = [
      makeVersion({
        version_id: "archived-1",
        mentor_display_badge: "In your archive",
        is_archived: true,
      }),
    ];

    expect(
      computeShouldShowHistoryHub([], archivedVersionHistory, makeMentorUiState()),
    ).toBe(true);
  });

  it("shows hub when only a student-archive version exists", () => {
    const versionHistory = [
      makeVersion({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
      }),
    ];

    expect(
      computeShouldShowHistoryHub(versionHistory, [], makeMentorUiState()),
    ).toBe(true);
  });

  it("hides hub when one workspace draft remains after another was archived", () => {
    const versionHistory = [
      makeVersion({ version_id: "draft-2", mentor_display_badge: "Your draft", version_number: 2 }),
    ];
    const archivedVersionHistory = [
      makeVersion({
        version_id: "draft-1",
        mentor_display_badge: "In your archive",
        is_archived: true,
        version_number: 1,
      }),
    ];

    expect(
      computeShouldShowHistoryHub(
        versionHistory,
        archivedVersionHistory,
        makeMentorUiState(),
      ),
    ).toBe(false);
  });

  it("hides hub when multiple workspace drafts exist", () => {
    const versionHistory = [
      makeVersion({ version_id: "draft-1", mentor_display_badge: "Your draft" }),
      makeVersion({ version_id: "draft-2", mentor_display_badge: "Your draft" }),
    ];
    const archivedVersionHistory = [
      makeVersion({
        version_id: "archived-1",
        mentor_display_badge: "In your archive",
        is_archived: true,
      }),
    ];

    expect(
      computeShouldShowHistoryHub(
        versionHistory,
        archivedVersionHistory,
        makeMentorUiState(),
      ),
    ).toBe(false);
  });

  it("hides hub when a live published version exists", () => {
    const versionHistory = [
      makeVersion({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
      }),
    ];

    expect(
      computeShouldShowHistoryHub(
        versionHistory,
        [],
        makeMentorUiState({ published_version_id: "live-1" }),
      ),
    ).toBe(false);
  });

  it("hides hub when an active working draft exists", () => {
    const versionHistory = [
      makeVersion({ version_id: "draft-1", mentor_display_badge: "Your draft", is_active: true }),
    ];
    const archivedVersionHistory = [
      makeVersion({
        version_id: "archived-1",
        mentor_display_badge: "In your archive",
        is_archived: true,
      }),
    ];

    expect(
      computeShouldShowHistoryHub(
        versionHistory,
        archivedVersionHistory,
        makeMentorUiState({ active_version_id: "draft-1" }),
      ),
    ).toBe(false);
  });

  it("shows hub when the only version moved to Previous for students (stale active_version_id)", () => {
    const versionHistory = [
      makeVersion({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
        is_active: true,
      }),
    ];

    expect(
      computeShouldShowHistoryHub(
        versionHistory,
        [],
        makeMentorUiState({ active_version_id: "prev-1" }),
      ),
    ).toBe(true);
  });

  it("shows hub when the only version was removed from students (stale active_version_id)", () => {
    const versionHistory = [
      makeVersion({
        version_id: "removed-1",
        mentor_display_badge: "Removed from students",
        is_active: true,
      }),
    ];

    expect(
      computeShouldShowHistoryHub(
        versionHistory,
        [],
        makeMentorUiState({ active_version_id: "removed-1" }),
      ),
    ).toBe(true);
  });

  it("hides hub when no historical versions exist", () => {
    const versionHistory = [
      makeVersion({ version_id: "draft-1", mentor_display_badge: "Your draft" }),
    ];

    expect(
      computeShouldShowHistoryHub(versionHistory, [], makeMentorUiState()),
    ).toBe(false);
  });
});

describe("shouldSilentlyActivateOnSelect", () => {
  it("activates student-archive versions that are not active", () => {
    expect(
      shouldSilentlyActivateOnSelect(
        makeVersion({
          version_id: "prev-1",
          mentor_display_badge: "Previous for students",
        }),
      ),
    ).toBe(true);
  });

  it("skips mentor shelf archives because activate would unarchive them", () => {
    expect(
      shouldSilentlyActivateOnSelect(
        makeVersion({
          version_id: "archived-1",
          mentor_display_badge: "In your archive",
          is_archived: true,
        }),
      ),
    ).toBe(false);
  });

  it("skips versions that are already active or live for students", () => {
    expect(
      shouldSilentlyActivateOnSelect(
        makeVersion({ version_id: "draft-1", is_active: true }),
      ),
    ).toBe(false);
    expect(
      shouldSilentlyActivateOnSelect(
        makeVersion({
          version_id: "live-1",
          is_published: true,
          mentor_display_badge: "Live for students",
        }),
      ),
    ).toBe(false);
  });
});
