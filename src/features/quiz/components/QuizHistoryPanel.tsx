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
    <div
      style={{
        marginTop: "1rem",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg-surface-alt)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Quiz history ({history.length})
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>
            <strong>Was live</strong> — previously published for students.
            {" "}
            <strong>In Previous versions</strong> — was live; students can still review.
            {" "}
            <strong>Removed</strong> — hidden from students; you can delete it here.
          </p>
          {history.map((item) => (
            <div
              key={item.quiz_id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-surface)",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
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
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {item.version_label} · {item.total_questions} questions · {item.difficulty}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                {item.can_view && viewingQuizId !== item.quiz_id && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onView(item.quiz_id)}
                    style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}
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
                    style={{
                      padding: "0.3rem 0.625rem",
                      fontSize: "0.75rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-danger, #dc2626)",
                      background: "none",
                      color: "var(--color-danger, #dc2626)",
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizHistoryPanel;
