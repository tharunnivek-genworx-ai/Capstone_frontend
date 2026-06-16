// src/features/quiz/components/QuizAnswerKeyPanel.tsx
import React from "react";
import type { QuizQuestionOut } from "../types/quiz.types";

interface QuizAnswerKeyPanelProps {
  questions: QuizQuestionOut[];
}

const QuizAnswerKeyPanel: React.FC<QuizAnswerKeyPanelProps> = ({ questions }) => {
  const activeQuestions = questions.filter((q) => q.is_active);

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "1.25rem",
      marginBottom: "1rem",
    }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
        Answer Key
      </h3>
      {activeQuestions.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>No active questions.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
          {activeQuestions.map((q, idx) => (
            <div
              key={q.question_id}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.5rem 0.75rem",
                background: "var(--color-bg-surface-alt)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", minWidth: "28px", fontWeight: 600 }}>
                Q{idx + 1}
              </span>
              <span style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "var(--color-success, #16a34a)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
              }}>
                {q.correct_option}
              </span>
              <span style={{
                fontSize: "0.8125rem", color: "var(--color-text-secondary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
              }}
                title={q[`option_${q.correct_option.toLowerCase()}` as keyof QuizQuestionOut] as string}
              >
                {q[`option_${q.correct_option.toLowerCase()}` as keyof QuizQuestionOut] as string}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizAnswerKeyPanel;
