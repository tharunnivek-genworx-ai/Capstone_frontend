import type { LlmErrorType } from "../types/studyMaterial.types";

export interface LlmDiagnosticsFields {
  errorType?: LlmErrorType | null;
  suggestion?: string | null;
  retryAfterSeconds?: number | null;
  nextLlmRetryAt?: string | null;
  qcInfraError?: boolean | null;
  providerMeta?: {
    retryAfterSeconds?: number | null;
    nextLlmRetryAt?: string | null;
  } | null;
}

export const LLM_ERROR_LABELS: Record<LlmErrorType, string> = {
  rate_limited: "AI service rate limited",
  token_limit: "Content too large for AI",
  llm_infra_error: "AI service temporarily unavailable",
  llm_key_pool_exhausted: "AI service unavailable",
  hint_quality_error: "Hint quality check failed",
};

export const LLM_ERROR_DESCRIPTIONS: Record<LlmErrorType, string> = {
  rate_limited:
    "The AI provider is temporarily limiting requests. Wait and try again.",
  token_limit: "The input was too large for the AI model.",
  llm_infra_error:
    "The AI service encountered a temporary error. Please try again later.",
  llm_key_pool_exhausted:
    "All configured AI API keys are currently unavailable.",
  hint_quality_error: "Some hints did not pass quality validation.",
};

export function resolveNextLlmRetryAt(
  entityRetryAt?: string | null,
  diagnostics?: LlmDiagnosticsFields | null,
): string | null {
  return (
    entityRetryAt ??
    diagnostics?.nextLlmRetryAt ??
    diagnostics?.providerMeta?.nextLlmRetryAt ??
    null
  );
}

export function resolveRetryAfterSeconds(
  diagnostics?: LlmDiagnosticsFields | null,
): number | null {
  if (diagnostics?.retryAfterSeconds != null) {
    return diagnostics.retryAfterSeconds;
  }
  if (diagnostics?.providerMeta?.retryAfterSeconds != null) {
    return diagnostics.providerMeta.retryAfterSeconds;
  }
  const retryAt = resolveNextLlmRetryAt(null, diagnostics);
  if (!retryAt) return null;
  const ms = new Date(retryAt).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : null;
}

export function formatRetryAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function buildLlmRetryMessage(
  retryAt: string | null,
  retryAfterSeconds: number | null,
): string | null {
  if (retryAt) {
    const date = new Date(retryAt);
    if (!Number.isNaN(date.getTime())) {
      if (date.getTime() > Date.now()) {
        return `You can try again after ${formatRetryAt(retryAt)}.`;
      }
      return "The rate limit should have cleared — you can try again now.";
    }
  }
  if (retryAfterSeconds != null && retryAfterSeconds > 0) {
    if (retryAfterSeconds < 60) {
      return `Please wait about ${retryAfterSeconds} second${
        retryAfterSeconds === 1 ? "" : "s"
      } before retrying.`;
    }
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return `Please wait about ${minutes} minute${
      minutes === 1 ? "" : "s"
    } before retrying.`;
  }
  return null;
}

export function isLlmGenerationFailure(
  diagnostics?: LlmDiagnosticsFields | null,
): boolean {
  return !!diagnostics?.errorType && !diagnostics.qcInfraError;
}

export function shouldShowLlmRetryNotice(
  diagnostics?: LlmDiagnosticsFields | null,
  entityRetryAt?: string | null,
): boolean {
  if (diagnostics?.errorType === "rate_limited") return true;
  return !!resolveNextLlmRetryAt(entityRetryAt, diagnostics);
}

/** Format a QC dimension score for display; null/undefined means not evaluated. */
export function formatQcScore(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value}/10`;
}

export function hasContentQcReport(diagnostics?: {
  overall_status?: string | null;
  scores?: object | null;
  wrong_answer_risk?: string | null;
} | null): boolean {
  return !!(
    diagnostics?.overall_status ||
    diagnostics?.wrong_answer_risk ||
    (diagnostics?.scores && Object.keys(diagnostics.scores).length > 0)
  );
}
