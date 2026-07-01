// src/features/quiz/components/QuizQuestionRegenerateModal.tsx
import React, { useState } from "react";
import ModalPortal from "../../../components/ModalPortal";

interface QuizQuestionRegenerateModalProps {
  questionIndex: number;
  questionText: string;
  hasHints: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
}

const MIN_LENGTH = 10;

const QuizQuestionRegenerateModal: React.FC<QuizQuestionRegenerateModalProps> = ({
  questionIndex,
  questionText,
  hasHints,
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
              <h3 className="study-material-modal__title">Regenerate question</h3>
              <p className="study-material-modal__subtitle">Question {questionIndex + 1}</p>
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
            <p
              style={{
                margin: "0 0 1rem",
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {questionText}
            </p>

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
                <strong>Warning:</strong> This will replace this question using AI and the published study material as context.
                {hasHints && " Existing hints for this question will be cleared."}
              </p>
            </div>

            <p className="study-material-modal__description">
              Describe how this question should change. The AI will rework the question text, options, and explanation while keeping the rest of the quiz unchanged.
            </p>
            <label htmlFor="question-regenerate-feedback" className="label">
              Your instructions
            </label>
            <textarea
              id="question-regenerate-feedback"
              autoFocus
              className="input-field"
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Make the distractors more plausible and focus the question on evaluation order instead of syntax."
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
                "Regenerate"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default QuizQuestionRegenerateModal;
