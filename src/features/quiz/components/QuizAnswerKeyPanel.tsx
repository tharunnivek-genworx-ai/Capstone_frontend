// src/features/quiz/components/QuizAnswerKeyPanel.tsx
import React, { useState } from "react";
import type { QuizQuestionOut } from "../types/quiz.types";

interface QuizAnswerKeyPanelProps {
  questions: QuizQuestionOut[];
  /** Smaller inline layout for history view */
  compact?: boolean;
  /** When compact, start collapsed */
  defaultCollapsed?: boolean;
}

const QuizAnswerKeyPanel: React.FC<QuizAnswerKeyPanelProps> = ({
  questions,
  compact = false,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const activeQuestions = questions.filter((q) => q.is_active);

  if (activeQuestions.length === 0) {
    return null;
  }

  if (compact && collapsed) {
    return (
      <button
        type="button"
        className="quiz-page__answer-key-toggle"
        onClick={() => setCollapsed(false)}
      >
        Show answer key ({activeQuestions.length} questions)
      </button>
    );
  }

  return (
    <div className={`quiz-answer-key${compact ? " quiz-answer-key--compact" : ""}`}>
      <div className="quiz-answer-key__head">
        <span className="quiz-answer-key__title">Answer key</span>
        {compact && (
          <button
            type="button"
            className="quiz-answer-key__hide"
            onClick={() => setCollapsed(true)}
          >
            Hide
          </button>
        )}
      </div>
      <div className="quiz-answer-key__grid">
        {activeQuestions.map((q, idx) => {
          const answerText = q[`option_${q.correct_option.toLowerCase()}` as keyof QuizQuestionOut] as string;
          return (
            <div key={q.question_id} className="quiz-answer-key__item" title={answerText}>
              <span className="quiz-answer-key__q">Q{idx + 1}</span>
              <span className="quiz-answer-key__letter">{q.correct_option}</span>
              <span className="quiz-answer-key__text">{answerText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizAnswerKeyPanel;
