import React from "react";
import type { SpaceUnpublishPreviewOut } from "../types/space.types";

interface EspaceUnpublishConfirmModalProps {
  preview: SpaceUnpublishPreviewOut;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const EspaceUnpublishConfirmModal: React.FC<EspaceUnpublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const materialNoun =
    preview.published_material_count === 1 ? "study material" : "study materials";
  const quizNoun = preview.published_quiz_count === 1 ? "quiz" : "quizzes";

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
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Unpublish this space?</h2>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              This will unpublish {preview.published_material_count} {materialNoun} and{" "}
              {preview.published_quiz_count} {quizNoun}. Trainees will immediately lose access to all
              content in this space. Draft content and quiz drafts will be retained and remain visible
              to you in Studio.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-danger"
                style={{ flex: 1, padding: "0.625rem 1rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Unpublishing…" : "Unpublish Space"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EspaceUnpublishConfirmModal;
