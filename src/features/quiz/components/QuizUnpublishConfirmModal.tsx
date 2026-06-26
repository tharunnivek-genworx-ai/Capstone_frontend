import React, { useState } from "react";
import type { QuizUnpublishPreviewOut, RetentionMode } from "../types/quiz.types";

interface QuizUnpublishConfirmModalProps {
  preview: QuizUnpublishPreviewOut;
  onClose: () => void;
  onConfirm: (retentionMode: RetentionMode) => void;
  isSubmitting: boolean;
}

const QuizUnpublishConfirmModal: React.FC<QuizUnpublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [retentionMode, setRetentionMode] = useState<RetentionMode>("keep_for_review");

  const confirmLabel =
    retentionMode === "keep_for_review"
      ? "Move to Previous versions"
      : "Remove completely";

  return (
    <>
      <div
        onClick={isSubmitting ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            pointerEvents: "auto",
            width: "min(480px, 95vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              Remove quiz from students?
            </h2>
          </div>

          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Attempt count — always shown including zero */}
            <div style={{
              background: "var(--color-surface-3, var(--color-surface))",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Student engagement
              </p>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                <strong style={{ color: "var(--color-text)" }}>{preview.trainees_attempt_count}</strong>
                {preview.trainees_attempt_count === 1 ? " student has" : " students have"} attempted this quiz
              </p>
            </div>

            {/* Retention radio choices */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  padding: "0.75rem",
                  border: `1.5px solid ${retentionMode === "keep_for_review" ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: isSubmitting ? "default" : "pointer",
                  background: retentionMode === "keep_for_review" ? "var(--color-accent-subtle, rgba(99,102,241,0.06))" : "transparent",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="quiz_retention_mode"
                  value="keep_for_review"
                  checked={retentionMode === "keep_for_review"}
                  onChange={() => setRetentionMode("keep_for_review")}
                  disabled={isSubmitting}
                  style={{ marginTop: "0.2rem", accentColor: "var(--color-accent)" }}
                />
                <div>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                    Keep for review (Previous versions)
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    Students can still review this quiz from Previous versions
                  </p>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  padding: "0.75rem",
                  border: `1.5px solid ${retentionMode === "remove_completely" ? "var(--color-danger, #e53e3e)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: isSubmitting ? "default" : "pointer",
                  background: retentionMode === "remove_completely" ? "var(--color-danger-subtle, rgba(229,62,62,0.06))" : "transparent",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="quiz_retention_mode"
                  value="remove_completely"
                  checked={retentionMode === "remove_completely"}
                  onChange={() => setRetentionMode("remove_completely")}
                  disabled={isSubmitting}
                  style={{ marginTop: "0.2rem", accentColor: "var(--color-danger, #e53e3e)" }}
                />
                <div>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                    Remove completely
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    Gone from students; not in Previous versions
                  </p>
                </div>
              </label>
            </div>

            {/* Attempter review note */}
            {preview.trainees_attempt_count > 0 && retentionMode === "remove_completely" && (
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Students who already attempted this quiz can still review their scores.
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(retentionMode)}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  ...(retentionMode === "remove_completely"
                    ? { background: "var(--color-danger, #e53e3e)", borderColor: "var(--color-danger, #e53e3e)" }
                    : {}),
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Removing…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizUnpublishConfirmModal;
