// src/features/quiz/components/QuizQuestionCard.tsx
import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { QuizQuestionOut, QuizQuestionUpdateRequest } from "../types/quiz.types";
import QuizQuestionModal from "./QuizQuestionModal";
import QuizQuestionRegenerateModal from "./QuizQuestionRegenerateModal";

interface QuizQuestionCardProps {
  question: QuizQuestionOut;
  index: number;
  isPublished: boolean;
  canEdit?: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isRegenerating: boolean;
  hintsStale?: boolean;
  onUpdate: (questionId: string, data: QuizQuestionUpdateRequest) => Promise<boolean>;
  onDelete: (questionId: string) => Promise<boolean>;
  onRegenerate: (questionId: string, feedback: string) => Promise<boolean>;
}

const OPTION_LABELS: Record<string, string> = { A: "A", B: "B", C: "C", D: "D" };

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  index,
  isPublished,
  canEdit = true,
  isSaving,
  isDeleting,
  isRegenerating,
  hintsStale = false,
  onUpdate,
  onDelete,
  onRegenerate,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.question_id, disabled: !question.is_active || isPublished || !canEdit });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : question.is_active ? 1 : 0.45,
  };

  const options: Array<{ letter: string; text: string | null }> = [
    { letter: "A", text: question.option_a },
    { letter: "B", text: question.option_b },
    { letter: "C", text: question.option_c },
    { letter: "D", text: question.option_d },
  ].filter((o) => o.text !== null) as Array<{ letter: string; text: string }>;

  const hasHints = Boolean(question.hint_1 || question.hint_2 || question.hint_3);
  const actionsDisabled = isSaving || isRegenerating || !canEdit;

  return (
    <>
      <div
        ref={setNodeRef}
        id={`quiz-question-${question.question_id}`}
        className={`quiz-question-card${question.is_active ? "" : " quiz-question-card--removed"}`}
        style={{
          ...style,
        }}
      >
        <div className="quiz-question-card__header">
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={!question.is_active || isPublished || !canEdit}
            className="quiz-question-card__drag"
            title={!canEdit ? "Editing is not available for this quiz" : "Drag to reorder"}
            aria-label={`Drag question ${index + 1} to reorder`}
          >
            <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" />
              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" />
              <circle cx="4" cy="16" r="1.5" /><circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>

          <div className="quiz-question-card__body">
            <div className="quiz-question-card__labels">
              <span className="quiz-question-card__number">
                Q{index + 1}
              </span>
              <span className={`quiz-question-card__source${question.source === "ai_generated" ? "" : " quiz-question-card__source--manual"}`}>
                {question.source === "ai_generated" ? "AI" : "Manual"}
              </span>
              {!question.is_active && (
                <span className="quiz-question-card__removed">
                  Removed
                </span>
              )}
              {hintsStale && question.is_active && (
                <span className="quiz-question-card__stale">Hints need refresh</span>
              )}
            </div>
            <p className="quiz-question-card__question">
              {question.question_text}
            </p>
          </div>

          {question.is_active && !isPublished && (
            <div className="quiz-question-card__actions">
              <button
                type="button"
                className="quiz-card-action"
                onClick={() => setShowRegenerateModal(true)}
                disabled={actionsDisabled}
                title={!canEdit ? "Editing is not available for this quiz" : "Regenerate question with AI"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0115.5-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 01-15.5 6.7L3 16" />
                </svg>
                Regenerate
              </button>
              <button
                type="button"
                className="quiz-card-action"
                onClick={() => setShowEditModal(true)}
                disabled={actionsDisabled}
                title={!canEdit ? "Editing is not available for this quiz" : "Edit question"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || isRegenerating || !canEdit}
                className="quiz-card-action quiz-card-action--danger"
                title={!canEdit ? "Editing is not available for this quiz" : "Delete question"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="quiz-question-card__options">
          {options.map(({ letter, text }) => {
            const isCorrect = question.correct_option === letter;
            return (
              <div
                key={letter}
                className={`quiz-question-option${isCorrect ? " quiz-question-option--correct" : ""}`}
              >
                <span className="quiz-question-option__letter">
                  {OPTION_LABELS[letter]}
                </span>
                <span className="quiz-question-option__text">
                  {text}
                </span>
                {isCorrect && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--as-success, #236863)" strokeWidth="2.5" aria-label="Correct answer">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {question.explanation && (
          <div className="quiz-question-card__explanation">
            <span>Explanation</span>
            <p>{question.explanation}</p>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="quiz-question-card__delete-confirm" role="alertdialog" aria-modal="true" aria-label="Delete question">
            <p>
              This will remove the question from the quiz. Trainee attempt history for this question will be preserved.
            </p>
            <div className="quiz-question-card__delete-actions">
              <button
                type="button"
                className="quiz-secondary-action"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void onDelete(question.question_id).then((succeeded) => {
                    if (succeeded) setShowDeleteConfirm(false);
                  });
                }}
                className="quiz-danger-action"
              >
                Delete question
              </button>
            </div>
          </div>
        )}
      </div>

      {showRegenerateModal && (
        <QuizQuestionRegenerateModal
          questionIndex={index}
          questionText={question.question_text}
          hasHints={hasHints}
          isSubmitting={isRegenerating}
          onClose={() => !isRegenerating && setShowRegenerateModal(false)}
          onConfirm={async (feedback) => {
            const succeeded = await onRegenerate(question.question_id, feedback);
            if (succeeded) setShowRegenerateModal(false);
          }}
        />
      )}

      {showEditModal && (
        <QuizQuestionModal
          mode="edit"
          question={question}
          isSaving={isSaving}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            const succeeded = await onUpdate(question.question_id, data as QuizQuestionUpdateRequest);
            if (succeeded) setShowEditModal(false);
          }}
        />
      )}
    </>
  );
};

export default QuizQuestionCard;
