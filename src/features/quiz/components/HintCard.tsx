// src/features/quiz/components/HintCard.tsx
import React from "react";
import type { QuizQuestionOut } from "../types/quiz.types";

interface HintCardProps {
  question: QuizQuestionOut;
  questionIndex: number;
  isPublished: boolean;
  canEdit?: boolean;
  isRegeneratingHints: boolean;
  onRequestRegenerateHints: (questionId: string) => void;
  onScrollToQuestion: (questionId: string) => void;
}

const HintCard: React.FC<HintCardProps> = ({
  question,
  questionIndex,
  isPublished,
  canEdit = true,
  isRegeneratingHints,
  onRequestRegenerateHints,
  onScrollToQuestion,
}) => {
  const hasHints = question.hint_1 && question.hint_2 && question.hint_3;
  const hasAnyHint = Boolean(question.hint_1 || question.hint_2 || question.hint_3);
  const canRegenerate = hasAnyHint && !isPublished && !isRegeneratingHints && canEdit;

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "1.25rem",
      marginBottom: "0.875rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <button
            type="button"
            onClick={() => onScrollToQuestion(question.question_id)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-primary)",
              textDecoration: "underline", textUnderlineOffset: "2px",
            }}
            title="Go to this question on page 3"
          >
            Question {questionIndex + 1}
          </button>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.45, maxWidth: "600px", whiteSpace: "pre-wrap" }}>
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
                : !hasAnyHint
                  ? "Generate hints for this question first"
                  : undefined
          }
          className="btn-secondary"
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.75rem",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            opacity: canRegenerate ? 1 : 0.45,
            cursor: canRegenerate ? "pointer" : "not-allowed",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Regenerate Hints
        </button>
      </div>

      {/* Hints */}
      {hasHints ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "0.875rem" }}>
          {[
            { label: "Hint 1 — Subtle nudge", value: question.hint_1 },
            { label: "Hint 2 — Narrowing", value: question.hint_2 },
            { label: "Hint 3 — Most explicit", value: question.hint_3 },
          ].map(({ label, value }, i) => (
            <div key={i} style={{
              display: "flex", gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              background: "var(--color-bg-surface-alt)",
              borderRadius: "var(--radius-md)",
              borderLeft: `3px solid ${i === 0 ? "#a78bfa" : i === 1 ? "#60a5fa" : "#34d399"}`,
            }}>
              <span style={{ flexShrink: 0, fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: "2px", minWidth: "120px" }}>
                {label}
              </span>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: "0.875rem", background: "var(--color-bg-surface-alt)",
          borderRadius: "var(--radius-md)", marginBottom: "0.875rem",
          textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem",
        }}>
          No hints generated yet for this question.
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div style={{
          padding: "0.625rem 0.875rem",
          background: "rgba(251,191,36,0.06)",
          borderRadius: "var(--radius-md)",
          borderLeft: "3px solid #f59e0b",
        }}>
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Explanation (shown to trainee after submission only)
          </span>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default HintCard;
