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
  onUpdate: (questionId: string, data: QuizQuestionUpdateRequest) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onRegenerate: (questionId: string, feedback: string) => Promise<void>;
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
        style={{
          ...style,
          background: question.is_active ? "var(--color-bg-surface)" : "var(--color-bg-surface-alt)",
          border: `1px solid var(--color-border)`,
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
          marginBottom: "0.875rem",
          position: "relative",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "0.875rem" }}>
          {/* Drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={!question.is_active || isPublished || !canEdit}
            style={{
              flexShrink: 0, background: "none", border: "none",
              cursor: (question.is_active && !isPublished && canEdit) ? "grab" : "not-allowed",
              color: "var(--color-text-muted)", padding: "0.125rem 0.25rem",
              marginTop: "2px",
              opacity: !canEdit ? 0.5 : 1,
            }}
            title={!canEdit ? "Editing is not available for this quiz" : "Drag to reorder"}
          >
            <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" />
              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" />
              <circle cx="4" cy="16" r="1.5" /><circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", background: "var(--color-bg-surface-alt)", padding: "0.2rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                Q{index + 1}
              </span>
              {/* Source badge */}
              <span style={{
                fontSize: "0.6875rem", fontWeight: 700, padding: "0.175rem 0.5rem", borderRadius: "var(--radius-sm)",
                background: question.source === "ai_generated" ? "var(--color-primary-subtle)" : "rgba(16,185,129,0.1)",
                color: question.source === "ai_generated" ? "var(--color-primary)" : "#059669",
                border: `1px solid ${question.source === "ai_generated" ? "var(--color-primary)" : "#059669"}`,
                textTransform: "uppercase", letterSpacing: "0.03em",
              }}>
                {question.source === "ai_generated" ? "AI" : "Manual"}
              </span>
              {!question.is_active && (
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.175rem 0.5rem", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.1)", color: "var(--color-danger, #dc2626)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  Removed
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {question.question_text}
            </p>
          </div>

          {/* Actions */}
          {question.is_active && !isPublished && (
            <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRegenerateModal(true)}
                disabled={actionsDisabled}
                style={{
                  padding: "0.375rem 0.625rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  opacity: !canEdit ? 0.5 : 1,
                  cursor: !canEdit ? "not-allowed" : "pointer",
                }}
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
                className="btn-secondary"
                onClick={() => setShowEditModal(true)}
                disabled={actionsDisabled}
                style={{
                  padding: "0.375rem 0.625rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  opacity: !canEdit ? 0.5 : 1,
                  cursor: !canEdit ? "not-allowed" : "pointer"
                }}
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
                style={{
                  padding: "0.375rem 0.625rem", fontSize: "0.75rem",
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  background: "none", border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", cursor: !canEdit ? "not-allowed" : "pointer",
                  color: "var(--color-danger, #dc2626)",
                  opacity: (isDeleting || !canEdit) ? 0.5 : 1,
                }}
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

        {/* Options */}
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.875rem" }}>
          {options.map(({ letter, text }) => {
            const isCorrect = question.correct_option === letter;
            return (
              <div
                key={letter}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isCorrect ? "rgba(22,163,74,0.4)" : "var(--color-border)"}`,
                  background: isCorrect ? "rgba(22,163,74,0.08)" : "var(--color-bg-surface-alt)",
                }}
              >
                <span style={{
                  flexShrink: 0, width: "24px", height: "24px",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: isCorrect ? "var(--color-success, #16a34a)" : "var(--color-bg-surface)",
                  color: isCorrect ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${isCorrect ? "transparent" : "var(--color-border)"}`,
                  fontSize: "0.6875rem", fontWeight: 700,
                }}>
                  {OPTION_LABELS[letter]}
                </span>
                <span style={{ fontSize: "0.875rem", color: isCorrect ? "rgb(22,101,52)" : "var(--color-text-secondary)", fontWeight: isCorrect ? 600 : 400, flex: 1 }}>
                  {text}
                </span>
                {isCorrect && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success, #16a34a)" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div style={{ padding: "0.625rem 0.875rem", background: "var(--color-bg-surface-alt)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Explanation</span>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {question.explanation}
            </p>
          </div>
        )}

        {/* Delete confirm inline */}
        {showDeleteConfirm && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "var(--radius-lg)",
            background: "rgba(255,255,255,0.95)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.875rem", padding: "1.25rem",
            zIndex: 10,
          }}>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-primary)", textAlign: "center" }}>
              This will remove the question from the quiz. Trainee attempt history for this question will be preserved.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: "0.375rem 0.875rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); onDelete(question.question_id); }}
                style={{
                  padding: "0.375rem 0.875rem", borderRadius: "var(--radius-md)",
                  background: "var(--color-danger, #dc2626)", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
                }}
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
            await onRegenerate(question.question_id, feedback);
            setShowRegenerateModal(false);
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
            await onUpdate(question.question_id, data as QuizQuestionUpdateRequest);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
};

export default QuizQuestionCard;
