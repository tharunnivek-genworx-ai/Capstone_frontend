import { describe, expect, it } from "vitest";
import {
  extractStudyMaterialErrorDetail,
  hasPatchChanges,
  isEspaceNotPublishedError,
  isPublishTransactionError,
  isSourcePdfDeleted,
  isUnpublishTransactionError,
  publishSuccessToastMessage,
} from "./studyMaterialHookHelpers";
import { resolveVersionSelectPanelFlags } from "./studyMaterialVersionSelect";
import type { StudyMaterialVersionSummary } from "../types/studyMaterial.types";

describe("studyMaterialHookHelpers", () => {
  it("detects whether a lifted-state patch changes any field", () => {
    const current = { isGenerating: true, runId: "run-1", page: 2 };
    expect(hasPatchChanges(current, { isGenerating: true, runId: "run-1" })).toBe(false);
    expect(hasPatchChanges(current, { isGenerating: false })).toBe(true);
  });

  it("extracts nested detail.message", () => {
    expect(
      extractStudyMaterialErrorDetail({
        response: { data: { detail: { message: "boom" } } },
      }),
    ).toBe("boom");
  });

  it("detects espace / publish / unpublish transaction codes", () => {
    expect(
      isEspaceNotPublishedError({
        response: { data: { detail: { error_code: "ESPACE_NOT_PUBLISHED" } } },
      }),
    ).toBe(true);
    expect(
      isPublishTransactionError({
        response: { data: { detail: { error_code: "PUBLISH_TRANSACTION_FAILED" } } },
      }),
    ).toBe(true);
    expect(
      isUnpublishTransactionError({
        response: { data: { detail: { error_code: "UNPUBLISH_TRANSACTION_FAILED" } } },
      }),
    ).toBe(true);
  });

  it("builds publish success toast for replace vs republish", () => {
    const version = { display_label: "v3" } as never;
    expect(
      publishSuccessToastMessage(version, {
        is_republishing_older: true,
        is_replacing_live_version: false,
      } as never),
    ).toContain("now live");
    expect(
      publishSuccessToastMessage(version, {
        is_republishing_older: false,
        is_replacing_live_version: true,
      } as never),
    ).toContain("replaced the live version");
  });

  it("detects deleted source PDF only when not still loading", () => {
    expect(
      isSourcePdfDeleted(
        { reference_material_id: "rm-1" } as never,
        null,
        false,
      ),
    ).toBe(true);
    expect(
      isSourcePdfDeleted(
        { reference_material_id: "rm-1" } as never,
        null,
        true,
      ),
    ).toBe(false);
  });
});

describe("resolveVersionSelectPanelFlags", () => {
  it("opens archived panel for archived summaries", () => {
    expect(
      resolveVersionSelectPanelFlags({
        is_archived: true,
      } as StudyMaterialVersionSummary),
    ).toEqual({ showArchivedPanel: true, expandStudentArchive: false });
  });

  it("expands student archive for Previous badge", () => {
    expect(
      resolveVersionSelectPanelFlags({
        is_archived: false,
        mentor_display_badge: "Previous for students",
      } as StudyMaterialVersionSummary),
    ).toEqual({ showArchivedPanel: false, expandStudentArchive: true });
  });
});
