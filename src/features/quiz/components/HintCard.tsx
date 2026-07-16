// src/features/quiz/components/HintCard.tsx
import React from "react";
import type { QuizQuestionOut } from "../types/quiz.types";

interface HintCardProps {
  question: QuizQuestionOut;
  questionIndex: number;
  isPublished: boolean;
  canEdit?: boolean;
  isRegeneratingHints: boolean;
  hintsStale?: boolean;
  onRequestRegenerateHints: (questionId: string) => void;
  onScrollToQuestion: (questionId: string) => void;
}

const HintCard: React.FC<HintCardProps> = ({
  question,
  questionIndex,
  isPublished,
  canEdit = true,
  isRegeneratingHints,
  hintsStale = false,
  onRequestRegenerateHints,
  onScrollToQuestion,
}) => {
  const hasAnyHint = Boolean(question.hint_1 || question.hint_2 || question.hint_3);
  const canRegenerate = !isPublished && !isRegeneratingHints && canEdit;
  const hintLevels = [
    { label: "Level 1 · Subtle nudge", value: question.hint_1 },
    { label: "Level 2 · Narrow the path", value: question.hint_2 },
    { label: "Level 3 · Most explicit", value: question.hint_3 },
  ];

  return (
    <article className="quiz-hint-card">
      <header className="quiz-hint-card__header">
        <div>
          <div className="quiz-hint-card__label-row">
            <button
              type="button"
              onClick={() => onScrollToQuestion(question.question_id)}
              className="quiz-hint-card__question-link"
              title="Go to this question in question review"
            >
              Question {questionIndex + 1}
            </button>
            {hintsStale && <span className="quiz-question-card__stale">Hints need refresh</span>}
          </div>
          <p className="quiz-hint-card__question">
            {question.question_text}
          </p>
        </div>

        <button
          type="button"
          onClick={() => canRegenerate && onRequestRegenerateHints(question.question_id)}
          disabled={!canRegenerate}
          title={
            !canEdit
              ? "Editing is not available for this quiz"
              : isPublished
                ? "Remove the quiz from students to edit hints"
                : undefined
          }
          className="quiz-card-action"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Regenerate hints
        </button>
      </header>

      {hasAnyHint ? (
        <div className="quiz-hint-levels">
          {hintLevels.map(({ label, value }) => (
            <div key={label} className={`quiz-hint-level${value ? "" : " quiz-hint-level--missing"}`}>
              <span className="quiz-hint-level__label">
                <span className="quiz-hint-level__marker" aria-hidden="true" />
                {label}
              </span>
              <p>{value ?? "This level was not generated. Regenerate this hint set to complete it."}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="quiz-hint-card__empty">
          No hints generated yet for this question.
        </div>
      )}

      {question.explanation && (
        <div className="quiz-hint-card__explanation">
          <span>
            Explanation (shown to trainee after submission only)
          </span>
          <p>{question.explanation}</p>
        </div>
      )}
    </article>
  );
};

export default HintCard;
