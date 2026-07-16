// src/features/quiz/components/QuizQuestionModal.tsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { CorrectOption, QuizQuestionCreateRequest, QuizQuestionOut, QuizQuestionUpdateRequest } from "../types/quiz.types";
import { isCompleteFourOptionQuestion } from "../utils/quizQuestionContract";

interface QuizQuestionModalProps {
  mode: "create" | "edit";
  question?: QuizQuestionOut;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: QuizQuestionCreateRequest | QuizQuestionUpdateRequest) => void;
}

const OPTION_LETTERS: CorrectOption[] = ["A", "B", "C", "D"];

const QuizQuestionModal: React.FC<QuizQuestionModalProps> = ({
  mode,
  question,
  isSaving,
  onClose,
  onSave,
}) => {
  const [questionText, setQuestionText] = useState(question?.question_text ?? "");
  const [optionA, setOptionA] = useState(question?.option_a ?? "");
  const [optionB, setOptionB] = useState(question?.option_b ?? "");
  const [optionC, setOptionC] = useState(question?.option_c ?? "");
  const [optionD, setOptionD] = useState(question?.option_d ?? "");
  const [correctOption, setCorrectOption] = useState<CorrectOption>(question?.correct_option ?? "A");
  const [explanation, setExplanation] = useState(question?.explanation ?? "");

  const canSave = isCompleteFourOptionQuestion({
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
  }) && !isSaving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const payload: QuizQuestionCreateRequest = {
      question_text: questionText.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_option: correctOption,
      explanation: explanation.trim() || null,
    };
    onSave(payload);
  };

  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem" };

  return createPortal(
    <div className="learning-experience learning-portal">
      <div
      className="study-material-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !isSaving && onClose()}
    >
      <div
        className="study-material-modal"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: "580px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="study-material-modal__header">
          <div>
            <h3 className="study-material-modal__title">
              {mode === "create" ? "Add question" : "Edit question"}
            </h3>
          </div>
          <button
            type="button"
            className="study-material-modal__close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="study-material-modal__body">
          <div style={fieldStyle}>
            <label style={labelStyle}>Question text *</label>
            <textarea
              className="input-field"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="Enter the question…"
              style={{ resize: "vertical", fontSize: "0.875rem" }}
              disabled={isSaving}
              required
            />
          </div>

          {/* Options */}
          {OPTION_LETTERS.map((letter) => {
            const val = letter === "A" ? optionA : letter === "B" ? optionB : letter === "C" ? optionC : optionD;
            const setter = letter === "A" ? setOptionA : letter === "B" ? setOptionB : letter === "C" ? setOptionC : setOptionD;
            const isCorrect = correctOption === letter;

            return (
              <div key={letter} style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <button
                  type="button"
                  onClick={() => setCorrectOption(letter)}
                  title={`Mark ${letter} as correct`}
                  style={{
                    flexShrink: 0, width: "28px", height: "28px",
                    borderRadius: "50%",
                    border: `2px solid ${isCorrect ? "var(--color-success, #16a34a)" : "var(--color-border)"}`,
                    background: isCorrect ? "var(--color-success, #16a34a)" : "transparent",
                    color: isCorrect ? "#fff" : "var(--color-text-muted)",
                    cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {letter}
                </button>
                <input
                  className="input-field"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={`Option ${letter} (required)`}
                  style={{ flex: 1, fontSize: "0.875rem" }}
                  disabled={isSaving}
                  required
                />
              </div>
            );
          })}

          <div style={{ margin: "0.5rem 0 0.75rem", padding: "0.5rem 0.875rem", background: "var(--color-bg-surface-alt)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Click a letter button to mark it as the correct answer. All four options are required.
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Explanation (optional)</label>
            <textarea
              className="input-field"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Explain why the correct answer is right…"
              style={{ resize: "vertical", fontSize: "0.875rem" }}
              disabled={isSaving}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving} style={{ padding: "0.5rem 1rem" }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!canSave} style={{ padding: "0.5rem 1.25rem" }}>
              {isSaving ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} />
                  Saving…
                </span>
              ) : "Save question"}
            </button>
          </div>
          </div>
        </form>
      </div>
      </div>
    </div>,
    document.body,
  );
};

export default QuizQuestionModal;
