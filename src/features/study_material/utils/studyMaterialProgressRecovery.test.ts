import { describe, expect, it } from "vitest";
import type {
  StudyMaterialMentorUiStateOut,
  StudyMaterialVersionSummary,
} from "../types/studyMaterial.types";
import {
  activeVersionIsWorkspaceDraft,
  decideActiveRunRecoveryProbe,
  isHistoricalVersionOut,
  isWorkspaceDraftVersionOut,
  preserveProgressFlagsInPatch,
  shouldApplyProgressFromActiveRun,
  shouldHydrateAsWorkspaceActiveVersion,
} from "./studyMaterialProgressRecovery";

function makeSummary(
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
    created_at: "2026-01-01T00:00:00Z",
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

describe("version out layer helpers", () => {
  it("classifies workspace draft vs Previous/Removed vs live", () => {
    expect(
      isWorkspaceDraftVersionOut({
        is_published: false,
        is_archived: false,
        published_at: null,
      }),
    ).toBe(true);
    expect(
      isHistoricalVersionOut({
        is_published: false,
        is_archived: false,
        published_at: "2026-01-01T00:00:00Z",
      }),
    ).toBe(true);
    expect(
      isHistoricalVersionOut({
        is_published: false,
        is_archived: true,
        published_at: "2026-01-01T00:00:00Z",
      }),
    ).toBe(true);
    expect(
      isWorkspaceDraftVersionOut({
        is_published: true,
        is_archived: false,
        published_at: "2026-01-01T00:00:00Z",
      }),
    ).toBe(false);
  });
});

describe("activeVersionIsWorkspaceDraft", () => {
  it("is true only for Your draft summaries", () => {
    const history = [
      makeSummary({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
        published_at: "2026-01-01T00:00:00Z",
      }),
      makeSummary({ version_id: "draft-1", mentor_display_badge: "Your draft" }),
    ];
    expect(activeVersionIsWorkspaceDraft({ version_id: "draft-1" }, history, [])).toBe(true);
    expect(activeVersionIsWorkspaceDraft({ version_id: "prev-1" }, history, [])).toBe(false);
    expect(activeVersionIsWorkspaceDraft(null, history, [])).toBe(false);
  });
});

describe("shouldHydrateAsWorkspaceActiveVersion", () => {
  it("rejects Previous-only / Removed-only history hub cases", () => {
    const previousOnly = [
      makeSummary({
        version_id: "prev-1",
        mentor_display_badge: "Previous for students",
        published_at: "2026-01-01T00:00:00Z",
        is_active: true,
      }),
    ];
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        { version_id: "prev-1", published_at: "2026-01-01T00:00:00Z", is_published: false },
        previousOnly,
        [],
        makeMentorUiState({ active_version_id: "prev-1", show_history_hub: true }),
      ),
    ).toBe(false);

    const removedOnly = [
      makeSummary({
        version_id: "removed-1",
        mentor_display_badge: "Removed from students",
        published_at: "2026-01-01T00:00:00Z",
      }),
    ];
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        { version_id: "removed-1", published_at: "2026-01-01T00:00:00Z", is_published: false },
        removedOnly,
        [],
        makeMentorUiState({ active_version_id: "removed-1", show_history_hub: true }),
      ),
    ).toBe(false);
  });

  it("allows workspace draft and live hydrate", () => {
    const drafts = [makeSummary({ version_id: "draft-1", mentor_display_badge: "Your draft" })];
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        { version_id: "draft-1", published_at: null, is_published: false },
        drafts,
        [],
        makeMentorUiState({ active_version_id: "draft-1" }),
      ),
    ).toBe(true);

    const live = [
      makeSummary({
        version_id: "live-1",
        mentor_display_badge: "Live for students",
        is_published: true,
        published_at: "2026-01-01T00:00:00Z",
      }),
    ];
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        { version_id: "live-1", is_published: true, published_at: "2026-01-01T00:00:00Z" },
        live,
        [],
        makeMentorUiState({ published_version_id: "live-1" }),
      ),
    ).toBe(true);
  });

  it("rejects hydrate while Progress is showing", () => {
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        { version_id: "draft-1", published_at: null },
        [makeSummary({ version_id: "draft-1" })],
        [],
        makeMentorUiState(),
        { isGeneratingOrProgressing: true },
      ),
    ).toBe(false);
  });

  it("classifies from VersionOut fields when summaries are empty", () => {
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        {
          version_id: "hist-1",
          is_published: false,
          is_archived: false,
          published_at: "2026-01-01T00:00:00Z",
        },
        [],
        [],
        null,
      ),
    ).toBe(false);
    expect(
      shouldHydrateAsWorkspaceActiveVersion(
        {
          version_id: "draft-1",
          is_published: false,
          is_archived: false,
          published_at: null,
        },
        [],
        [],
        null,
      ),
    ).toBe(true);
  });
});

describe("decideActiveRunRecoveryProbe", () => {
  it("probes for Previous-only remount (no local Progress, no module ownership)", () => {
    expect(
      decideActiveRunRecoveryProbe({
        moduleOwnsNode: false,
        localIsGenerating: false,
        generationRunPaused: false,
        generationRunFailed: false,
        failedGenerationPipeline: null,
      }),
    ).toEqual({ shouldProbe: true, clearModuleOwnership: false });
  });

  it("clears stale module ownership after space-switch wipe then probes", () => {
    expect(
      decideActiveRunRecoveryProbe({
        moduleOwnsNode: true,
        localIsGenerating: false,
        generationRunPaused: false,
        generationRunFailed: false,
        failedGenerationPipeline: null,
      }),
    ).toEqual({ shouldProbe: true, clearModuleOwnership: true });
  });

  it("does not probe while local wait is already attached", () => {
    expect(
      decideActiveRunRecoveryProbe({
        moduleOwnsNode: true,
        localIsGenerating: true,
        generationRunPaused: false,
        generationRunFailed: false,
        failedGenerationPipeline: null,
      }),
    ).toEqual({ shouldProbe: false, clearModuleOwnership: false });
  });

  it("does not probe when paused/failed Progress is already showing", () => {
    expect(
      decideActiveRunRecoveryProbe({
        moduleOwnsNode: false,
        localIsGenerating: false,
        generationRunPaused: true,
        generationRunFailed: false,
        failedGenerationPipeline: "study_material",
      }),
    ).toEqual({ shouldProbe: false, clearModuleOwnership: false });

    expect(
      decideActiveRunRecoveryProbe({
        moduleOwnsNode: false,
        localIsGenerating: false,
        generationRunPaused: false,
        generationRunFailed: true,
        failedGenerationPipeline: "study_material",
      }),
    ).toEqual({ shouldProbe: false, clearModuleOwnership: false });
  });
});

describe("shouldApplyProgressFromActiveRun", () => {
  it("applies Progress for running/paused/failed even when a draft exists", () => {
    expect(shouldApplyProgressFromActiveRun("running")).toBe(true);
    expect(shouldApplyProgressFromActiveRun("paused")).toBe(true);
    expect(shouldApplyProgressFromActiveRun("failed")).toBe(true);
  });

  it("does not apply Progress for null/completed (Your-draft + finished run)", () => {
    expect(shouldApplyProgressFromActiveRun(null)).toBe(false);
    expect(shouldApplyProgressFromActiveRun("completed")).toBe(false);
  });
});

describe("preserveProgressFlagsInPatch", () => {
  it("strips isGenerating:false when an SM run is still progressing", () => {
    const patch = preserveProgressFlagsInPatch(
      { isGenerating: true },
      { currentPage: 2 as const, isGenerating: false },
    );
    expect(patch).toEqual({ currentPage: 2 });
    expect("isGenerating" in patch).toBe(false);
  });

  it("keeps isGenerating:false when nothing is progressing", () => {
    expect(
      preserveProgressFlagsInPatch({ isGenerating: false }, { currentPage: 2, isGenerating: false }),
    ).toEqual({ currentPage: 2, isGenerating: false });
  });

  it("preserves paused Progress against selectNode wipe", () => {
    const patch = preserveProgressFlagsInPatch(
      {
        generationRunPaused: true,
        failedGenerationPipeline: "study_material",
        isGenerating: false,
      },
      { currentPage: 2, isGenerating: false, hasTriggeredGeneration: true },
    );
    expect(patch.isGenerating).toBeUndefined();
    expect(patch.currentPage).toBe(2);
    expect(patch.hasTriggeredGeneration).toBe(true);
  });
});
