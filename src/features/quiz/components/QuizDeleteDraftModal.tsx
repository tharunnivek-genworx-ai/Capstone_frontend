// src/features/quiz/components/QuizDeleteDraftModal.tsx
import React from "react";
import ModalPortal from "../../../components/ModalPortal";

interface QuizDeleteDraftModalProps {
  hasGeneratedHints: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const QuizDeleteDraftModal: React.FC<QuizDeleteDraftModalProps> = ({
  hasGeneratedHints,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  return (
    <ModalPortal>
      <div
        className="study-material-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      >
        <div
          className="study-material-modal"
          role="dialog"
          aria-modal="true"
          style={{ maxWidth: "460px" }}
        >
          <div style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger, #dc2626)" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Delete quiz draft?
              </h2>
            </div>

            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              This will <strong>permanently delete this quiz draft and all its questions</strong>
              {hasGeneratedHints ? " and any generated hints" : ""}. This cannot be undone.
            </p>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              Trainee attempt history for this quiz will be preserved.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ padding: "0.5rem 1rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "var(--radius-md)",
                  background: "var(--color-danger, #dc2626)", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderTopColor: "#fff" }} />
                    Deleting…
                  </span>
                ) : "Delete draft"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default QuizDeleteDraftModal;
