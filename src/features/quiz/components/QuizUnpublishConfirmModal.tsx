import React, { useState } from "react";
import ModalPortal from "../../../components/ModalPortal";
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
    <ModalPortal>
      <div
        className="quiz-lifecycle-modal-overlay"
        onClick={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}
      >
        <div className="quiz-lifecycle-modal animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="quiz-unpublish-title">
          <div className="quiz-lifecycle-modal__header">
            <span>Student visibility</span>
            <h2 id="quiz-unpublish-title">Remove quiz from students?</h2>
          </div>

          <div className="quiz-lifecycle-modal__body">
            <div className="quiz-lifecycle-modal__notice">
              <strong>Student engagement</strong><br />
              <span>
                <strong>{preview.trainees_attempt_count}</strong>
                {preview.trainees_attempt_count === 1 ? " student has" : " students have"} attempted this quiz
              </span>
            </div>

            <div className="quiz-lifecycle-modal__choices">
              <label
                className={`quiz-lifecycle-choice${retentionMode === "keep_for_review" ? " quiz-lifecycle-choice--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="quiz_retention_mode"
                  value="keep_for_review"
                  checked={retentionMode === "keep_for_review"}
                  onChange={() => setRetentionMode("keep_for_review")}
                  disabled={isSubmitting}
                />
                <div>
                  <strong>Keep for review (Previous versions)</strong>
                  <span>Students can still review this quiz from Previous versions.</span>
                </div>
              </label>

              <label
                className={`quiz-lifecycle-choice quiz-lifecycle-choice--danger${retentionMode === "remove_completely" ? " quiz-lifecycle-choice--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="quiz_retention_mode"
                  value="remove_completely"
                  checked={retentionMode === "remove_completely"}
                  onChange={() => setRetentionMode("remove_completely")}
                  disabled={isSubmitting}
                />
                <div>
                  <strong>Remove completely</strong>
                  <span>Hide it from students and do not keep it in Previous versions.</span>
                </div>
              </label>
            </div>

            {preview.trainees_attempt_count > 0 && retentionMode === "remove_completely" && (
              <p>
                Students who already attempted this quiz can still review their scores.
              </p>
            )}
          </div>

          <div className="quiz-lifecycle-modal__actions">
            <button type="button" onClick={onClose} className="quiz-secondary-action" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(retentionMode)}
              className={retentionMode === "remove_completely" ? "quiz-danger-action" : "quiz-primary-action"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Removing…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default QuizUnpublishConfirmModal;
