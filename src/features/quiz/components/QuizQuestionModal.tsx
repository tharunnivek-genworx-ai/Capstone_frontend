// src/features/quiz/components/QuizQuestionModal.tsx
import React, { useState, useEffect } from "react";
import type { CorrectOption, QuizQuestionCreateRequest, QuizQuestionOut, QuizQuestionUpdateRequest } from "../types/quiz.types";

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

  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text);
      setOptionA(question.option_a);
      setOptionB(question.option_b);
      setOptionC(question.option_c ?? "");
      setOptionD(question.option_d ?? "");
      setCorrectOption(question.correct_option);
      setExplanation(question.explanation ?? "");
    }
  }, [question?.question_id]);

  const canSave =
    questionText.trim().length >= 5 &&
    optionA.trim().length > 0 &&
    optionB.trim().length > 0 &&
    !isSaving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const payload: QuizQuestionCreateRequest = {
      question_text: questionText.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim() || null,
      option_d: optionD.trim() || null,
      correct_option: correctOption,
      explanation: explanation.trim() || null,
    };
    onSave(payload);
  };

  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "1rem",
      overflowY: "auto",
    }}>
      <div style={{
        background: "var(--color-bg-surface)", borderRadius: "var(--radius-xl)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: "100%", maxWidth: "580px",
        padding: "1.75rem", margin: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {mode === "create" ? "Add question" : "Edit question"}
          </h2>
          <button type="button" onClick={onClose} disabled={isSaving}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.25rem", borderRadius: "var(--radius-sm)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
            const required = letter === "A" || letter === "B";
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
                  placeholder={`Option ${letter}${required ? " (required)" : " (optional)"}`}
                  style={{ flex: 1, fontSize: "0.875rem" }}
                  disabled={isSaving}
                />
              </div>
            );
          })}

          <div style={{ margin: "0.5rem 0 0.75rem", padding: "0.5rem 0.875rem", background: "var(--color-bg-surface-alt)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Click a letter button to mark it as the correct answer. Options A and B are required.
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

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
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
        </form>
      </div>
    </div>
  );
};

export default QuizQuestionModal;
