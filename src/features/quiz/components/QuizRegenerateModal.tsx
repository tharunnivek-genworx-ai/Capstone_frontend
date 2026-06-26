// src/features/quiz/components/QuizRegenerateModal.tsx
import React, { useState } from "react";
import ModalPortal from "../../../components/ModalPortal";
import type { QuizDifficulty } from "../types/quiz.types";

const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

interface QuizRegenerateModalProps {
  nodeTitle: string;
  quizTitle: string;
  hasGeneratedHints: boolean;
  isSubmitting: boolean;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  difficulty: QuizDifficulty;
  setDifficulty: (d: QuizDifficulty) => void;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
}

const QuizRegenerateModal: React.FC<QuizRegenerateModalProps> = ({
  nodeTitle,
  quizTitle,
  hasGeneratedHints,
  isSubmitting,
  questionCount,
  setQuestionCount,
  difficulty,
  setDifficulty,
  onClose,
  onConfirm,
}) => {
  const [feedback, setFeedback] = useState("");
  const minLen = 10;
  const canSubmit = feedback.trim().length >= minLen && !isSubmitting;

  return (
    <ModalPortal>
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "var(--color-bg-surface)", borderRadius: "var(--radius-xl)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: "100%", maxWidth: "520px",
        padding: "1.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Regenerate quiz
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {nodeTitle} · {quizTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.25rem", borderRadius: "var(--radius-sm)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {hasGeneratedHints && (
          <div style={{
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem",
          }}>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-danger, #dc2626)", lineHeight: 1.55 }}>
              <strong>Warning:</strong> The generated hints for this quiz will also be deleted. Would you like to proceed?
            </p>
          </div>
        )}

        <div style={{
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem",
        }}>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-danger, #dc2626)", lineHeight: 1.55 }}>
            <strong>Warning:</strong> This will replace your current draft questions using the existing quiz as context.
            Reference PDF parsing will not run again.
          </p>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
            Number of questions
          </label>
          <input
            type="number"
            className="input-field"
            value={questionCount}
            min={5}
            max={20}
            onChange={(e) => setQuestionCount(Math.max(5, Math.min(20, parseInt(e.target.value) || 10)))}
            disabled={isSubmitting}
            style={{ width: "140px", fontSize: "0.9375rem" }}
          />
          <span style={{ marginLeft: "0.625rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            (5 – 20)
          </span>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
            Difficulty
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {DIFFICULTY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value)}
                disabled={isSubmitting}
                style={{
                  padding: "0.4rem 1rem", borderRadius: "var(--radius-md)",
                  border: `1px solid ${difficulty === value ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: difficulty === value ? "var(--color-primary-subtle)" : "var(--color-bg-surface)",
                  color: difficulty === value ? "var(--color-primary)" : "var(--color-text-secondary)",
                  cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8125rem",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
          Your instructions
        </p>
        <textarea
          autoFocus
          className="input-field"
          placeholder="e.g. Make the questions harder. Remove questions about hooks and focus more on state management."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          style={{ resize: "vertical", minHeight: "100px", fontSize: "0.875rem", lineHeight: 1.55 }}
          disabled={isSubmitting}
        />
        <p style={{ margin: "0.375rem 0 1.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          Minimum {minLen} characters ({feedback.trim().length}/{minLen})
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: "0.5rem 1rem" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => canSubmit && onConfirm(feedback.trim())}
            disabled={!canSubmit}
            style={{ padding: "0.5rem 1.25rem" }}
          >
            {isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} />
                Regenerating…
              </span>
            ) : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

export default QuizRegenerateModal;
