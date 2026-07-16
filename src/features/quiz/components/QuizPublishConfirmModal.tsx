import React from "react";
import ModalPortal from "../../../components/ModalPortal";

interface QuizPublishConfirmModalProps {
  quizTitle: string;
  otherLiveQuizTitle: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const QuizPublishConfirmModal: React.FC<QuizPublishConfirmModalProps> = ({
  quizTitle,
  otherLiveQuizTitle,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const currentLive = otherLiveQuizTitle ?? "the current live quiz";

  return (
    <ModalPortal>
      <div
        className="quiz-lifecycle-modal-overlay"
        onClick={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}
      >
        <div className="quiz-lifecycle-modal animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="quiz-publish-title">
          <div className="quiz-lifecycle-modal__header">
            <span>Student visibility</span>
            <h2 id="quiz-publish-title">Replace the live quiz?</h2>
          </div>
          <div className="quiz-lifecycle-modal__body">
            <p>
              Making <strong>{quizTitle}</strong> live will replace what students see today.
            </p>
            <div className="quiz-lifecycle-modal__notice">
              <strong>Students will see</strong><br />
              {quizTitle}
            </div>
            <p>
              {currentLive} moves to Previous for students. Students who already took either quiz can still review their scores.
            </p>
          </div>
          <div className="quiz-lifecycle-modal__actions">
            <button type="button" onClick={onClose} className="quiz-secondary-action" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm} className="quiz-primary-action" disabled={isSubmitting}>
              {isSubmitting ? "Making live…" : "Replace live quiz"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default QuizPublishConfirmModal;
