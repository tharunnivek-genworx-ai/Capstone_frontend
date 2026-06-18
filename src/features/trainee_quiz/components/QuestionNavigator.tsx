import React from "react";
import type { QuestionState } from "../types/traineeQuiz.types";

interface QuestionNavigatorProps {
  questions: Array<{ question_id: string; order_index: number; is_active: boolean }>;
  questionStates: Record<string, QuestionState>;
  currentQuestionId: string | null;
  onSelect: (questionId: string) => void;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  questionStates,
  currentQuestionId,
  onSelect,
}) => {
  const activeQuestions = questions.filter((q) => q.is_active);

  return (
    <aside className="trainee-quiz-nav">
      <h2 className="trainee-quiz-nav__title">Question Navigator</h2>

      <div className="trainee-quiz-nav__legend">
        <LegendItem status="notVisited" label="Not visited" />
        <LegendItem status="visited" label="Visited" />
        <LegendItem status="answered" label="Answered" />
        <LegendItem status="skipped" label="Skipped" />
        <LegendItem status="flagged" label="Flagged" />
      </div>

      <div className="trainee-quiz-nav__grid">
        {activeQuestions.map((q, index) => {
          const state = questionStates[q.question_id];
          const status = state?.status ?? "notVisited";
          const isActive = q.question_id === currentQuestionId;
          const isFlagged = state?.isFlagged ?? false;

          return (
            <button
              key={q.question_id}
              type="button"
              className={[
                "trainee-quiz-nav__box",
                `trainee-quiz-nav__box--${status}`,
                isActive ? "trainee-quiz-nav__box--current" : "",
                isFlagged ? "trainee-quiz-nav__box--flagged" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(q.question_id)}
              title={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

const LegendItem: React.FC<{ status: string; label: string }> = ({ status, label }) => (
  <span className="trainee-quiz-nav__legend-item">
    <span className={`trainee-quiz-nav__legend-swatch trainee-quiz-nav__legend-swatch--${status}`} />
    {label}
  </span>
);

export default QuestionNavigator;
