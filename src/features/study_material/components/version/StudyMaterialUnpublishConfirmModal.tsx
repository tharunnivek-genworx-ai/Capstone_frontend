import React from "react";
import type { RetentionMode, StudyMaterialUnpublishPreviewOut } from "../../types/studyMaterial.types";

interface StudyMaterialUnpublishConfirmModalProps {
  preview: StudyMaterialUnpublishPreviewOut;
  onClose: () => void;
  onConfirm: (retentionMode: RetentionMode) => void;
  isSubmitting: boolean;
  transactionError: string | null;
}

function ModalHeader({
  title,
  onClose,
  isSubmitting,
}: {
  title: string;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="btn-secondary"
        style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", flexShrink: 0 }}
        disabled={isSubmitting}
      >
        Cancel
      </button>
    </div>
  );
}

const StudyMaterialUnpublishConfirmModal: React.FC<StudyMaterialUnpublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
  transactionError,
}) => {
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
          <ModalHeader
            title="Remove this material from students?"
            onClose={onClose}
            isSubmitting={isSubmitting}
          />

          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {transactionError && (
              <p style={{
                fontSize: "0.875rem",
                color: "var(--color-danger, #e53e3e)",
                margin: 0,
                padding: "0.75rem",
                background: "var(--color-danger-subtle, rgba(229,62,62,0.08))",
                borderRadius: "var(--radius-md)",
                lineHeight: 1.5,
              }}>
                {transactionError}
              </p>
            )}

            {!transactionError && (
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                Choose what happens to {preview.version_label} for students.
              </p>
            )}

            <div style={{
              background: "var(--color-surface-3, var(--color-surface))",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Students who engaged with this topic
              </p>
              <ul style={{ margin: 0, padding: "0 0 0 1.25rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>{preview.trainees_read_count}</strong>
                  {preview.trainees_read_count === 1 ? " student" : " students"} read this study material
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>{preview.trainees_quiz_attempt_count}</strong>
                  {preview.trainees_quiz_attempt_count === 1 ? " student" : " students"} attempted the quiz
                </li>
              </ul>
            </div>

            {preview.has_live_quiz && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "var(--color-info-subtle, rgba(59,130,246,0.08))",
                border: "1px solid var(--color-info-border, rgba(59,130,246,0.25))",
                borderRadius: "var(--radius-md)",
              }}>
                <span style={{ fontSize: "0.875rem", lineHeight: 1 }}>ℹ️</span>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  The live quiz
                  {preview.live_quiz_title ? (
                    <> (<strong style={{ color: "var(--color-text)" }}>{preview.live_quiz_title}</strong>)</>
                  ) : null}
                  {" "}is not changed. Remove it separately on the Quiz tab if needed.
                </p>
              </div>
            )}

            {!transactionError && (
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>
                Updating content? Publish a new version instead — the current edition moves to Previous versions automatically.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => onConfirm("keep_for_review")}
                className="btn-primary"
                style={{ width: "100%", padding: "0.625rem 1rem", textAlign: "left" }}
                disabled={isSubmitting}
              >
                <span style={{ display: "block", fontWeight: 600 }}>
                  {isSubmitting ? "Removing…" : transactionError ? "Try again" : "Move to previous version"}
                </span>
                {!isSubmitting && !transactionError && (
                  <span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.8125rem", fontWeight: 400, opacity: 0.9 }}>
                    Students can still open this edition from Previous versions.
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onConfirm("remove_completely")}
                className="btn-secondary"
                style={{
                  width: "100%",
                  padding: "0.625rem 1rem",
                  textAlign: "left",
                  borderColor: "var(--color-danger, #e53e3e)",
                  color: "var(--color-danger, #e53e3e)",
                }}
                disabled={isSubmitting}
              >
                <span style={{ display: "block", fontWeight: 600 }}>
                  {isSubmitting ? "Removing…" : transactionError ? "Try again" : "Remove this from students"}
                </span>
                {!isSubmitting && !transactionError && (
                  <span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.8125rem", fontWeight: 400, opacity: 0.85 }}>
                    Gone from students; not in Previous versions.
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudyMaterialUnpublishConfirmModal;
