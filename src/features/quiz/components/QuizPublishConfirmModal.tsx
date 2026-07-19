import React, { useState } from "react";
import ModalPortal from "../../../components/ModalPortal";
import { isValidPassThreshold } from "../utils/passThreshold";

interface QuizPublishConfirmModalProps {
  quizTitle: string;
  otherLiveQuizTitle: string | null;
  initialPassThresholdPercent: number;
  onClose: () => void;
  onConfirm: (passThresholdPercent: number) => void;
  isSubmitting: boolean;
}

const QuizPublishConfirmModal: React.FC<QuizPublishConfirmModalProps> = ({
  quizTitle,
  otherLiveQuizTitle,
  initialPassThresholdPercent,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [thresholdInput, setThresholdInput] = useState(String(initialPassThresholdPercent));
  const currentLive = otherLiveQuizTitle ?? "the current live quiz";
  const parsedThreshold = Number(thresholdInput);
  const thresholdIsValid = isValidPassThreshold(parsedThreshold);
  const isReplacing = otherLiveQuizTitle !== null;

  return (
    <ModalPortal>
      <div
        className="quiz-lifecycle-modal-overlay"
        onClick={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}
      >
        <div className="quiz-lifecycle-modal animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="quiz-publish-title">
          <div className="quiz-lifecycle-modal__header">
            <span>Student visibility</span>
            <h2 id="quiz-publish-title">
              {isReplacing ? "Replace the live quiz?" : "Publish this quiz?"}
            </h2>
          </div>
          <div className="quiz-lifecycle-modal__body">
            <p>
              Making <strong>{quizTitle}</strong> live will replace what students see today.
            </p>
            <div className="quiz-lifecycle-modal__notice">
              <strong>Students will see</strong><br />
              {quizTitle}
            </div>
            {isReplacing && (
              <p>
                {currentLive} moves to Previous for students. Students who already took either quiz can still review their scores.
              </p>
            )}
            <label className="quiz-pass-threshold-field" htmlFor="quiz-publish-pass-threshold">
              <span>Pass score required (%)</span>
              <input
                id="quiz-publish-pass-threshold"
                type="number"
                min={1}
                max={100}
                step={1}
                value={thresholdInput}
                onChange={(event) => setThresholdInput(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={!thresholdIsValid}
              />
              <small>Enter a whole number from 1 to 100.</small>
            </label>
          </div>
          <div className="quiz-lifecycle-modal__actions">
            <button type="button" onClick={onClose} className="quiz-secondary-action" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => thresholdIsValid && onConfirm(parsedThreshold)}
              className="quiz-primary-action"
              disabled={isSubmitting || !thresholdIsValid}
            >
              {isSubmitting ? "Making live…" : isReplacing ? "Replace live quiz" : "Publish quiz"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default QuizPublishConfirmModal;
