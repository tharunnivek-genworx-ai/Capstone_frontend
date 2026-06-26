import React from "react";
import type { LlmErrorType } from "../../types/studyMaterial.types";
import {
  LLM_ERROR_DESCRIPTIONS,
  LLM_ERROR_LABELS,
  buildLlmRetryMessage,
  resolveNextLlmRetryAt,
  resolveRetryAfterSeconds,
  shouldShowLlmRetryNotice,
  type LlmDiagnosticsFields,
} from "../../utils/llmDiagnostics";

interface LlmDiagnosticsNoticeProps {
  diagnostics?: LlmDiagnosticsFields | null;
  entityNextLlmRetryAt?: string | null;
}

const LlmDiagnosticsNotice: React.FC<LlmDiagnosticsNoticeProps> = ({
  diagnostics,
  entityNextLlmRetryAt,
}) => {
  const errorType = diagnostics?.errorType;
  const retryAt = resolveNextLlmRetryAt(entityNextLlmRetryAt, diagnostics);
  const retryAfterSeconds = resolveRetryAfterSeconds(diagnostics);
  const retryMessage =
    shouldShowLlmRetryNotice(diagnostics, entityNextLlmRetryAt)
      ? buildLlmRetryMessage(retryAt, retryAfterSeconds)
      : null;

  if (!errorType && !retryMessage) return null;

  const label = errorType ? LLM_ERROR_LABELS[errorType as LlmErrorType] : null;
  const description = errorType
    ? LLM_ERROR_DESCRIPTIONS[errorType as LlmErrorType]
    : null;

  return (
    <div
      style={{
        marginTop: "0.625rem",
        padding: "0.625rem 0.75rem",
        borderRadius: "var(--radius-md)",
        backgroundColor: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(217, 119, 6, 0.35)",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
      }}
    >
      {label && (
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#92400e" }}>
          {label}
        </span>
      )}
      {description && (
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#b45309", lineHeight: 1.45 }}>
          {description}
        </p>
      )}
      {retryMessage && (
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#b45309", lineHeight: 1.45 }}>
          {retryMessage}
        </p>
      )}
      {diagnostics?.suggestion && (
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.45,
            fontStyle: "italic",
          }}
        >
          {diagnostics.suggestion}
        </p>
      )}
    </div>
  );
};

export default LlmDiagnosticsNotice;
