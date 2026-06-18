import React from "react";
import type { QuizPanelActions } from "../../types/traineeNodePanel.types";

interface TopicQuizActionsProps {
  quiz: QuizPanelActions | null | undefined;
  isStartingQuiz: boolean;
  onTakeQuiz: () => void;
  onViewAttempts: () => void;
  readAction: React.ReactNode;
}

/** Primary reading CTA plus quiz start / past-attempts links for leaf and mixed panels. */
const TopicQuizActions: React.FC<TopicQuizActionsProps> = ({
  quiz,
  isStartingQuiz,
  onTakeQuiz,
  onViewAttempts,
  readAction,
}) => {
  if (!quiz) {
    return <div className="topic-detail-panel__actions">{readAction}</div>;
  }

  return (
    <div className="topic-detail-panel__actions">
      {readAction}
      {quiz.show_quiz_button && (
        <button
          type="button"
          className={quiz.quiz_button_variant === "primary" ? "btn-primary" : "btn-secondary"}
          onClick={onTakeQuiz}
          disabled={isStartingQuiz}
        >
          {isStartingQuiz ? "Loading…" : quiz.quiz_button_label}
        </button>
      )}
      {quiz.show_attempts_button && (
        <button type="button" className="btn-secondary" onClick={onViewAttempts}>
          {quiz.attempts_button_label}
        </button>
      )}
    </div>
  );
};

export default TopicQuizActions;
