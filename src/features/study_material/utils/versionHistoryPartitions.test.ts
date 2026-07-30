import { describe, expect, it } from "vitest";

import {
  computeShouldShowHistoryHub,
  isHistoricalMentorSummary,
  isStudyMaterialProgressing,
  isWorkspaceDraftSummary,
  partitionHistoryVersions,
  resolveShouldShowHistoryHub,
  shouldSilentlyActivateOnSelect,
} from "./versionHistoryPartitions";
import {
  HISTORY_HUB_PARITY_FIXTURES,
  makeHistoryHubMentorUiState as makeMentorUiState,
  makeHistoryHubVersion as makeVersion,
} from "./historyHubParity.fixtures";

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

describe("layer helpers", () => {
  it("classifies workspace draft vs historical mentor summaries", () => {
    expect(
      isWorkspaceDraftSummary(makeVersion({ version_id: "d1", mentor_display_badge: "Your draft" })),
    ).toBe(true);
    expect(
      isWorkspaceDraftSummary(
        makeVersion({ version_id: "live", mentor_display_badge: "Live for students" }),
      ),
    ).toBe(false);

    expect(
      isHistoricalMentorSummary(
        makeVersion({ version_id: "p1", mentor_display_badge: "Previous for students" }),
      ),
    ).toBe(true);
    expect(
      isHistoricalMentorSummary(
        makeVersion({ version_id: "r1", mentor_display_badge: "Removed from students" }),
      ),
    ).toBe(true);
    expect(
      isHistoricalMentorSummary(
        makeVersion({
          version_id: "a1",
          mentor_display_badge: "In your archive",
          is_archived: true,
        }),
      ),
    ).toBe(true);
    expect(
      isHistoricalMentorSummary(
        makeVersion({ version_id: "d1", mentor_display_badge: "Your draft" }),
      ),
    ).toBe(false);
  });

  it("detects study-material progressing flags", () => {
    expect(isStudyMaterialProgressing({ isGenerating: true })).toBe(true);
    expect(isStudyMaterialProgressing({ isPausingGeneration: true })).toBe(true);
    expect(
      isStudyMaterialProgressing({
        generationRunPaused: true,
        failedGenerationPipeline: "study_material",
      }),
    ).toBe(true);
    expect(
      isStudyMaterialProgressing({
        generationRunFailed: true,
        failedGenerationPipeline: "study_material",
      }),
    ).toBe(true);
    expect(
      isStudyMaterialProgressing({
        generationRunFailed: true,
        failedGenerationPipeline: "quiz",
      }),
    ).toBe(false);
    expect(isStudyMaterialProgressing({})).toBe(false);
  });
});

describe("resolveShouldShowHistoryHub", () => {
  it.each(
    HISTORY_HUB_PARITY_FIXTURES.flatMap((fixture) =>
      [false, true].map((isGeneratingOrProgressing) => ({
        ...fixture,
        isGeneratingOrProgressing,
      })),
    ),
  )(
    "API show_history_hub=$eligible ($id) × Progress=$isGeneratingOrProgressing",
    ({
      mentorUiState,
      eligible,
      isGeneratingOrProgressing,
    }) => {
      expect(
        resolveShouldShowHistoryHub(mentorUiState, {
          isGeneratingOrProgressing,
        }),
      ).toBe(isGeneratingOrProgressing ? false : eligible);
    },
  );

  it("prefers server show_history_hub over client recomputation", () => {
    // Client rule would be true; server says false.
    expect(
      resolveShouldShowHistoryHub(makeMentorUiState({ show_history_hub: false })),
    ).toBe(false);
    // Client rule would be false (live); server says true.
    expect(
      resolveShouldShowHistoryHub(
        makeMentorUiState({
          published_version_id: "live-1",
          show_history_hub: true,
        }),
      ),
    ).toBe(true);
  });

  it("returns false when mentor UI state is null", () => {
    expect(resolveShouldShowHistoryHub(null)).toBe(false);
  });
});

describe("computeShouldShowHistoryHub", () => {
  it.each(
    HISTORY_HUB_PARITY_FIXTURES.flatMap((fixture) =>
      [false, true].map((isGeneratingOrProgressing) => ({
        ...fixture,
        isGeneratingOrProgressing,
      })),
    ),
  )(
    "matches $id ($name) eligibility with Progress=$isGeneratingOrProgressing",
    ({
      versionHistory,
      archivedVersionHistory,
      mentorUiState,
      eligible,
      isGeneratingOrProgressing,
    }) => {
      expect(
        computeShouldShowHistoryHub(versionHistory, archivedVersionHistory, mentorUiState, {
          isGeneratingOrProgressing,
        }),
      ).toBe(isGeneratingOrProgressing ? false : eligible);
    },
  );

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

  it("hides hub when a study-material run is progressing", () => {
    const versionHistory = [
      makeVersion({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
      }),
    ];

    expect(
      computeShouldShowHistoryHub(versionHistory, [], makeMentorUiState(), {
        isGeneratingOrProgressing: true,
      }),
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
