/** Static mentor-facing copy when the API does not supply warning_presentation. */

import type { LlmDiagnosticsFields } from "./llmDiagnostics";
import { isLlmRateLimited } from "./llmDiagnostics";

export const QC_LLM_FAILED_TITLE = "Quality review recommended";
export const QC_LLM_FAILED_BODY =
  "This study material did not pass our quality analysis. That does not mean the content is invalid or weak — it means it did not meet our company-set standards. Read the draft carefully and review the report below before discarding or proceeding with this draft.";

interface QcDisplayCheck {
  id?: string | null;
  check_id?: string | null;
  passed?: boolean | null;
  evidence?: string | null;
  corrective_hint?: string | null;
}

interface QcDisplayPresentationItem {
  user_message?: string | null;
}

interface QcDisplayResult extends LlmDiagnosticsFields {
  mentorDismissedQcWarning?: boolean | null;
  checks?: QcDisplayCheck[] | null;
  failed_checks?: QcDisplayCheck[] | null;
  issues?: string[] | null;
  humanized_issues?: string[] | null;
  corrective_instructions?: string | null;
  humanized_corrective_instructions?: string | null;
  summary?: string | null;
  flagged_questions?: Array<{ flags?: string[] | null }> | null;
  /** Server SoT for placement-only suppression (camelCase or snake_case). */
  shouldShowMentorQcWarning?: boolean | null;
  should_show_mentor_qc_warning?: boolean | null;
  warning_presentation?: {
    det_summary?: string | null;
    reassurance?: string | null;
    formatting_items?: QcDisplayPresentationItem[] | null;
    structure_items?: QcDisplayPresentationItem[] | null;
    evidence_items?: QcDisplayPresentationItem[] | null;
  } | null;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function failedChecks(qcResult: QcDisplayResult): QcDisplayCheck[] {
  const fromChecks = (qcResult.checks ?? []).filter(
    (check) => check.passed === false,
  );
  return fromChecks.length > 0 ? fromChecks : (qcResult.failed_checks ?? []);
}

/** Prefer API placement policy; undefined means legacy payload without the flag. */
function resolveShouldShowMentorQcWarning(
  qcResult: QcDisplayResult,
): boolean | undefined {
  if (typeof qcResult.shouldShowMentorQcWarning === "boolean") {
    return qcResult.shouldShowMentorQcWarning;
  }
  if (typeof qcResult.should_show_mentor_qc_warning === "boolean") {
    return qcResult.should_show_mentor_qc_warning;
  }
  return undefined;
}

function hasUserFacingQcDetail(qcResult: QcDisplayResult): boolean {
  if (
    hasText(qcResult.suggestion) ||
    hasText(qcResult.corrective_instructions) ||
    hasText(qcResult.humanized_corrective_instructions) ||
    hasText(qcResult.summary) ||
    qcResult.issues?.some(hasText) ||
    qcResult.humanized_issues?.some(hasText)
  ) {
    return true;
  }

  if (
    failedChecks(qcResult).some(
      (check) => hasText(check.evidence) || hasText(check.corrective_hint),
    )
  ) {
    return true;
  }

  const presentation = qcResult.warning_presentation;
  const presentationItems = [
    ...(presentation?.formatting_items ?? []),
    ...(presentation?.structure_items ?? []),
    ...(presentation?.evidence_items ?? []),
  ];
  if (
    hasText(presentation?.det_summary) ||
    hasText(presentation?.reassurance) ||
    presentationItems.some((item) => hasText(item.user_message))
  ) {
    return true;
  }

  return (
    qcResult.flagged_questions?.some((question) =>
      question.flags?.some(hasText),
    ) ?? false
  );
}

/** Show code-quality scoring only for programming-focused topics. */
export function shouldShowCodeQualityScore(
  domain: "STEM" | "Programming" | "Conceptual" | "Mixed" | "" | null | undefined,
): boolean {
  return domain === "Programming";
}

export function isQcWarningDismissed(
  qcResult?: { mentorDismissedQcWarning?: boolean | null } | null,
): boolean {
  return qcResult?.mentorDismissedQcWarning === true;
}

export function shouldShowQcWarning(
  qcFailedPermanently: boolean | undefined,
  qcResult?: QcDisplayResult | null,
): boolean {
  if (!qcFailedPermanently) return false;
  if (isLlmRateLimited(qcResult)) return true;
  if (!qcResult || isQcWarningDismissed(qcResult)) return false;
  if (qcResult.errorType) return true;

  const mentorQcPolicy = resolveShouldShowMentorQcWarning(qcResult);
  if (mentorQcPolicy === false) return false;

  return hasUserFacingQcDetail(qcResult);
}
