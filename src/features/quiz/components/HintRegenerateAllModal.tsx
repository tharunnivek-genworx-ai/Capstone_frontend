// src/features/quiz/components/HintRegenerateAllModal.tsx
import React, { useState } from "react";
import ModalPortal from "../../../components/ModalPortal";

interface HintRegenerateAllModalProps {
  questionCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
}

const MIN_LENGTH = 10;

const HintRegenerateAllModal: React.FC<HintRegenerateAllModalProps> = ({
  questionCount,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const [feedback, setFeedback] = useState("");
  const trimmed = feedback.trim();
  const canSubmit = trimmed.length >= MIN_LENGTH && !isSubmitting;

  return (
    <ModalPortal>
      <div
        className="study-material-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      >
        <div className="study-material-modal" role="dialog" aria-modal="true">
          <div className="study-material-modal__header">
            <div>
              <h3 className="study-material-modal__title">Regenerate all hints</h3>
              <p className="study-material-modal__subtitle">
                {questionCount} question{questionCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              className="study-material-modal__close"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="study-material-modal__body">
            <div
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-danger, #dc2626)", lineHeight: 1.55 }}>
                <strong>Warning:</strong> This will regenerate hints for every question in the quiz. Current hints will be replaced.
              </p>
            </div>

            <p className="study-material-modal__description">
              Describe how the hints should change across the quiz. The AI will rewrite all three hints for each question.
            </p>
            <label htmlFor="hint-regenerate-all-feedback" className="label">
              Your instructions
            </label>
            <textarea
              id="hint-regenerate-all-feedback"
              autoFocus
              className="input-field"
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Make all hints more subtle, avoid giving away the answer in hint 1, and keep hint 3 focused on the key concept."
              disabled={isSubmitting}
              style={{ resize: "vertical", minHeight: "100px" }}
            />
            <p className="study-material-modal__hint">
              Minimum {MIN_LENGTH} characters ({trimmed.length}/{MIN_LENGTH})
            </p>
          </div>

          <div className="study-material-modal__footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => canSubmit && onConfirm(trimmed)}
              disabled={!canSubmit}
              style={{ minWidth: "120px" }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" /> Regenerating…
                </>
              ) : (
                "Regenerate all"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default HintRegenerateAllModal;
