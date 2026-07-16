import React, { useState } from "react";
import type { QuizHistoryItemOut } from "../types/quiz.types";

interface QuizHistoryPanelProps {
  history: QuizHistoryItemOut[];
  onView: (quizId: string) => void;
  onDelete: (quizId: string) => void;
  isDeleting: boolean;
  viewingQuizId?: string | null;
}

function badgeStyle(badge: string): React.CSSProperties {
  const normalized = badge.toLowerCase();
  if (normalized.includes("previous")) {
    return {
      background: "rgba(100,116,139,0.12)",
      color: "#64748b",
      border: "1px solid #94a3b8",
    };
  }
  if (normalized.includes("removed")) {
    return {
      background: "rgba(239,68,68,0.08)",
      color: "#b91c1c",
      border: "1px solid #fca5a5",
    };
  }
  if (normalized.includes("was live")) {
    return {
      background: "rgba(59,130,246,0.08)",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    };
  }
  return {
    background: "var(--color-bg-surface-alt)",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
  };
}

const QuizHistoryPanel: React.FC<QuizHistoryPanelProps> = ({
  history,
  onView,
  onDelete,
  isDeleting,
  viewingQuizId = null,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="quiz-history" aria-label="Quiz history">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="quiz-history__toggle"
        aria-expanded={expanded}
      >
        <span>
          Quiz history
          <span className="quiz-history__count">{history.length}</span>
        </span>
        <span>
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="quiz-history__body">
          <p className="quiz-history__legend">
            <strong>Was live</strong> — previously published for students.
            {" "}
            <strong>In Previous versions</strong> — was live; students can still review.
            {" "}
            <strong>Removed</strong> — hidden from students; you can delete it here.
          </p>
          {history.map((item) => (
            <div key={item.quiz_id} className="quiz-history__item">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <span className="quiz-history__item-title">
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.4rem",
                      borderRadius: "var(--radius-sm)",
                      textTransform: "uppercase",
                      ...badgeStyle(item.status_badge),
                    }}
                  >
                    {item.status_badge}
                  </span>
                </div>
                <p className="quiz-history__item-meta">
                  {item.version_label} · {item.total_questions} questions · {item.difficulty}
                </p>
              </div>
              <div className="quiz-history__item-actions">
                {item.can_view && viewingQuizId !== item.quiz_id && (
                  <button
                    type="button"
                    className="quiz-secondary-action"
                    onClick={() => onView(item.quiz_id)}
                  >
                    View
                  </button>
                )}
                {viewingQuizId === item.quiz_id && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", padding: "0.3rem 0" }}>
                    Viewing
                  </span>
                )}
                {item.can_delete && viewingQuizId !== item.quiz_id && (
                  <button
                    type="button"
                    onClick={() => onDelete(item.quiz_id)}
                    disabled={isDeleting}
                    className="quiz-danger-action"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default QuizHistoryPanel;
