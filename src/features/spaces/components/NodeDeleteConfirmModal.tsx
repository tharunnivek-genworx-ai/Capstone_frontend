import React from "react";
import type { NodeDeletePreviewOut } from "../../mentor_progress_view/types/mentorProgress.types";

interface NodeDeleteConfirmModalProps {
  nodeTitle: string;
  preview: NodeDeletePreviewOut;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const NodeDeleteConfirmModal: React.FC<NodeDeleteConfirmModalProps> = ({
  nodeTitle,
  preview,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const materialNoun =
    preview.live_study_material_count === 1 ? "study material" : "study materials";
  const quizNoun = preview.live_quiz_count === 1 ? "quiz" : "quizzes";
  const topicNoun = preview.topic_count === 1 ? "topic" : "topics";

  return (
    <>
      <div
        onClick={isSubmitting ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            pointerEvents: "auto",
            width: "min(520px, 95vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Delete this topic?
              </h2>
              <p
                style={{
                  margin: "0.125rem 0 0",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "380px",
                }}
              >
                &ldquo;{nodeTitle}&rdquo;
              </p>
            </div>
          </div>

          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              Students will no longer be able to see live content on{" "}
              {preview.topic_count === 1 ? "this topic" : `these ${preview.topic_count} ${topicNoun}`}.
              {preview.topic_count > 1 ? " All subtopics will be deleted as well." : null}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div
                style={{
                  background: "var(--color-surface-3, var(--color-surface))",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem 1.125rem",
                }}
              >
                <p style={{ margin: "0 0 0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Live study material
                </p>
                <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
                  {preview.live_study_material_count}
                </p>
                <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  published {materialNoun}
                </p>
              </div>

              <div
                style={{
                  background: "var(--color-surface-3, var(--color-surface))",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem 1.125rem",
                }}
              >
                <p style={{ margin: "0 0 0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Live quizzes
                </p>
                <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
                  {preview.live_quiz_count}
                </p>
                <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  published {quizNoun}
                </p>
              </div>
            </div>

            {(preview.live_study_material_count > 0 || preview.live_quiz_count > 0) && (
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-warning, #d97706)", lineHeight: 1.5 }}>
                This will remove {preview.live_study_material_count} live {materialNoun} and{" "}
                {preview.live_quiz_count} live {quizNoun} from student view immediately.
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-danger"
                style={{ flex: 1, padding: "0.625rem 1rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting…" : "Delete topic"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NodeDeleteConfirmModal;
