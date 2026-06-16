import React from "react";
import type { StudyMaterialUnpublishPreviewOut } from "../types/studyMaterial.types";

interface StudyMaterialUnpublishConfirmModalProps {
  preview: StudyMaterialUnpublishPreviewOut;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  transactionError: string | null;
}

const StudyMaterialUnpublishConfirmModal: React.FC<StudyMaterialUnpublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
  transactionError,
}) => {
  const body = transactionError
    ? transactionError
    : preview.has_draft_quizzes
      ? "A quiz draft is linked to this version. The draft will be retained but quiz actions will be paused until this version is re-published. Trainees will not see this material or any quizzes for this node."
      : preview.has_published_quizzes
        ? "Unpublishing will also unpublish the quiz and its hints for this node. Trainees will not see this material or its quiz until you re-publish."
        : "Trainees will no longer see this content.";

  const confirmLabel = preview.has_published_quizzes && !preview.has_draft_quizzes
    ? "Unpublish & Unpublish Quiz"
    : "Unpublish";

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
            width: "min(440px, 95vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Unpublish study material?</h2>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              {body}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-primary"
                style={{ flex: 1, padding: "0.625rem 1rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Unpublishing…" : transactionError ? "Try Again" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudyMaterialUnpublishConfirmModal;
