import type {
  ReferenceMaterialOut,
  StudyMaterialPublishPreviewOut,
  StudyMaterialVersionOut,
} from "../types/studyMaterial.types";

/** Shown when a draft's frozen reference_material_id no longer has an active upload. */
export const SOURCE_PDF_DELETED_BLOCK_REASON =
  "The reference PDF for this draft was removed. Upload a new PDF, or discard drafts and generate fresh from page 1 without a reference document.";

/** Design §14 — mild mentor copy when External Research fail-softs (not QC tone). */
export const EXTERNAL_RESEARCH_FAIL_SOFT_MESSAGE =
  "We couldn't find enough reliable information online for this topic, so this version was generated without external references. You can attach a reference PDF instead, or edit the generated content directly.";

/** Avoid allocating lifted per-node state when a poll repeats identical fields. */
export function hasPatchChanges<T extends object>(
  current: T,
  patch: Partial<T>,
): boolean {
  return Object.entries(patch).some(
    ([key, value]) => current[key as keyof T] !== value,
  );
}

export function isSourcePdfDeleted(
  activeVersion: StudyMaterialVersionOut | null,
  referenceMaterial: ReferenceMaterialOut | null,
  isLoadingGenerationSource: boolean,
): boolean {
  return Boolean(
    activeVersion?.reference_material_id != null &&
    !referenceMaterial &&
    !isLoadingGenerationSource
  );
}

export function extractStudyMaterialErrorDetail(err: unknown): string {
  const e = err as {
    response?: { data?: string | { detail?: string | { message?: string; error_code?: string } } };
    message?: string;
  };
  if (typeof e?.response?.data === "string") return e.response.data;
  const detail = e?.response?.data?.detail;
  if (typeof detail === "object" && detail?.message) return detail.message;
  return (typeof detail === "string" ? detail : undefined) ?? e?.message ?? "Request failed.";
}

export function isEspaceNotPublishedError(err: unknown): boolean {
  const e = err as { response?: { data?: { detail?: { error_code?: string } } } };
  return e?.response?.data?.detail?.error_code === "ESPACE_NOT_PUBLISHED";
}

export function isPublishTransactionError(err: unknown): boolean {
  const e = err as { response?: { data?: { detail?: { error_code?: string } } } };
  return e?.response?.data?.detail?.error_code === "PUBLISH_TRANSACTION_FAILED";
}

export function isUnpublishTransactionError(err: unknown): boolean {
  const e = err as { response?: { data?: { detail?: { error_code?: string } } } };
  return e?.response?.data?.detail?.error_code === "UNPUBLISH_TRANSACTION_FAILED";
}

export function publishSuccessToastMessage(
  version: StudyMaterialVersionOut,
  preview: StudyMaterialPublishPreviewOut | null,
): string {
  if (preview?.is_republishing_older) {
    return `${version.display_label} is now live for students.`;
  }
  if (preview?.is_replacing_live_version && !preview.is_republishing_older) {
    return `${version.display_label} replaced the live version.`;
  }
  return `${version.display_label} is now live for students.`;
}
