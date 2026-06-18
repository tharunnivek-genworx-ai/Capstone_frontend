import React from "react";
import type { CorrectOption, QuestionState, TraineeQuizQuestionOut } from "../types/traineeQuiz.types";
import { getHintTexts, getOptions } from "../utils/questionState";
import QuizRichText from "./QuizRichText";

interface QuizQuestionAreaProps {
  quizTitle: string;
  question: TraineeQuizQuestionOut;
  questionState: QuestionState | null;
  questionIndex: number;
  totalQuestions: number;
  pendingSelection: CorrectOption | null;
  feedback: "success" | "incorrect" | null;
  isSubmitting: boolean;
  isReadOnly: boolean;
  onSelectOption: (option: CorrectOption) => void;
  onClearSelection: () => void;
  onSubmitAnswer: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onExpandHints: () => void;
  onShowNextHint: () => void;
  onCollapseHints: () => void;
  onSaveExit: () => void;
  onSubmitQuiz: () => void;
  isSubmittingQuiz: boolean;
}

const QuizQuestionArea: React.FC<QuizQuestionAreaProps> = ({
  quizTitle,
  question,
  questionState,
  questionIndex,
  totalQuestions,
  pendingSelection,
  feedback,
  isSubmitting,
  isReadOnly,
  onSelectOption,
  onClearSelection,
  onSubmitAnswer,
  onSkip,
  onPrevious,
  onNext,
  onToggleFlag,
  onExpandHints,
  onShowNextHint,
  onCollapseHints,
  onSaveExit,
  onSubmitQuiz,
  isSubmittingQuiz,
}) => {
  const options = getOptions(question);
  const canChangeSelection = question.can_answer && !isReadOnly;
  const hintsExpanded = questionState?.hintsExpanded ?? false;
  const visibleHintCount = questionState?.visibleHintCount ?? 0;
  const hintLevelUnlocked = questionState?.hintLevelUnlocked ?? 0;
  const hintTexts = getHintTexts(question, visibleHintCount);
  const showHintSection =
    !isReadOnly && feedback === "incorrect" && hintLevelUnlocked > 0 && !question.was_locked;
  const canShowNextHint = hintsExpanded && visibleHintCount < hintLevelUnlocked;

  return (
    <div className="trainee-quiz-main">
      <div className="trainee-quiz-main__card">
        <div className="trainee-quiz-main__top">
          <div>
            <p className="trainee-quiz-main__course">{quizTitle}</p>
            <h1 className="trainee-quiz-main__heading">
              Question {questionIndex + 1} of {totalQuestions}
            </h1>
          </div>
          <div className="trainee-quiz-main__top-actions">
            <button type="button" className="trainee-quiz-btn trainee-quiz-btn--ghost" onClick={onSaveExit}>
              Save &amp; Exit
            </button>
            <button
              type="button"
              className="trainee-quiz-btn trainee-quiz-btn--primary"
              onClick={() => void onSubmitQuiz()}
              disabled={isSubmittingQuiz || isReadOnly}
            >
              {isSubmittingQuiz ? "Submitting…" : "Submit quiz"}
            </button>
          </div>
        </div>

        <div className="trainee-quiz-main__divider" />

        {!question.is_active && (
          <div className="trainee-quiz-main__removed-banner">This question was removed by your mentor.</div>
        )}

        <div className="trainee-quiz-main__question">
          <QuizRichText content={question.question_text} />
        </div>

        {feedback === "success" && (
          <div className="trainee-quiz-main__feedback trainee-quiz-main__feedback--success">
            Correct! You can move on to the next question.
          </div>
        )}

        {feedback === "incorrect" && !question.was_locked && (
          <div className="trainee-quiz-main__feedback trainee-quiz-main__feedback--error">
            That&apos;s not correct yet. You can try again or view a hint.
          </div>
        )}

        <div className="trainee-quiz-main__options">
          {options.map(({ letter, text }) => {
            const isSelected = pendingSelection === letter;
            return (
              <button
                key={letter}
                type="button"
                className={[
                  "trainee-quiz-option",
                  isSelected ? "trainee-quiz-option--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => canChangeSelection && onSelectOption(letter as CorrectOption)}
                disabled={!canChangeSelection}
              >
                <span className="trainee-quiz-option__radio" aria-hidden />
                <span className="trainee-quiz-option__letter">{letter}</span>
                <span className="trainee-quiz-option__text">
                  <QuizRichText content={text} />
                </span>
              </button>
            );
          })}
        </div>

        {showHintSection && (
          <div className="trainee-quiz-hints">
            <p className="trainee-quiz-hints__label">Need help?</p>
            {!hintsExpanded ? (
              <button
                type="button"
                className="trainee-quiz-btn trainee-quiz-btn--secondary trainee-quiz-btn--sm"
                onClick={onExpandHints}
              >
                View hints
              </button>
            ) : (
              <div className="trainee-quiz-hints__panel">
                <button
                  type="button"
                  className="trainee-quiz-hints__panel-header"
                  onClick={onCollapseHints}
                >
                  <span>
                    Hint {visibleHintCount} of {Math.min(hintLevelUnlocked, 3)}
                  </span>
                  <span aria-hidden>▾</span>
                </button>
                <div className="trainee-quiz-hints__body">
                  {hintTexts.map((hint, idx) => (
                    <div key={idx} className="trainee-quiz-hints__item">
                      {idx > 0 && <div className="trainee-quiz-hints__divider" />}
                      <QuizRichText content={hint} />
                    </div>
                  ))}
                </div>
                {canShowNextHint && (
                  <button
                    type="button"
                    className="trainee-quiz-btn trainee-quiz-btn--secondary trainee-quiz-btn--sm trainee-quiz-hints__next"
                    onClick={onShowNextHint}
                  >
                    Show next hint
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isReadOnly && question.explanation && (
          <div className="trainee-quiz-main__explanation">
            <strong>Explanation</strong>
            <QuizRichText content={question.explanation} />
            {question.correct_option && (
              <p className="trainee-quiz-main__correct">
                Correct answer: {question.correct_option}
              </p>
            )}
          </div>
        )}

        <div className="trainee-quiz-main__actions">
          <div className="trainee-quiz-main__actions-left">
            <button
              type="button"
              className="trainee-quiz-btn trainee-quiz-btn--secondary"
              onClick={onPrevious}
              disabled={questionIndex <= 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="trainee-quiz-btn trainee-quiz-btn--link"
              onClick={() => void onSkip()}
              disabled={!question.can_skip || isReadOnly || isSubmitting}
            >
              Skip
            </button>
            <button
              type="button"
              className={`trainee-quiz-btn trainee-quiz-btn--link trainee-quiz-flag ${questionState?.isFlagged ? "trainee-quiz-flag--active" : ""}`}
              onClick={onToggleFlag}
              disabled={isReadOnly}
            >
              ★ Flag for review
            </button>
          </div>
          <div className="trainee-quiz-main__actions-right">
            <button
              type="button"
              className="trainee-quiz-btn trainee-quiz-btn--secondary"
              onClick={onClearSelection}
              disabled={!canChangeSelection || !pendingSelection}
            >
              Clear selection
            </button>
            <button
              type="button"
              className="trainee-quiz-btn trainee-quiz-btn--primary"
              onClick={() => void onSubmitAnswer()}
              disabled={!canChangeSelection || !pendingSelection || isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit answer"}
            </button>
            <button
              type="button"
              className="trainee-quiz-btn trainee-quiz-btn--secondary"
              onClick={onNext}
              disabled={questionIndex >= totalQuestions - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionArea;
