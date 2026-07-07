/** Static mentor-facing copy when the API does not supply warning_presentation. */

import type { LlmDiagnosticsFields } from "./llmDiagnostics";
import { isLlmRateLimited } from "./llmDiagnostics";

export const QC_LLM_FAILED_TITLE = "Quality review recommended";
export const QC_LLM_FAILED_BODY =
  "This study material did not pass our quality analysis. That does not mean the content is invalid or weak — it means it did not meet our company-set standards. Read the draft carefully and review the report below before discarding or proceeding with this draft.";

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
  qcResult?: (LlmDiagnosticsFields & { mentorDismissedQcWarning?: boolean | null }) | null,
): boolean {
  if (!qcFailedPermanently) return false;
  if (isLlmRateLimited(qcResult)) return true;
  return !isQcWarningDismissed(qcResult);
}
