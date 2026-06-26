import React from "react";

interface QuizPublishConfirmModalProps {
  quizTitle: string;
  otherLiveQuizTitle: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const QuizPublishConfirmModal: React.FC<QuizPublishConfirmModalProps> = ({
  quizTitle,
  otherLiveQuizTitle,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const currentLive = otherLiveQuizTitle ?? "the current live quiz";

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
            width: "min(440px, 95vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Replace the live quiz?</h2>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
              Making <strong>{quizTitle}</strong> live will replace what students see today.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", margin: "0 0 0.75rem", lineHeight: 1.6, fontWeight: 600 }}>
              Students will see: {quizTitle}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              {currentLive} moves to Previous for students. Students who already took either quiz can still review their scores.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-primary"
                style={{ flex: 1, padding: "0.625rem 1rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Making live…" : "Replace live quiz"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizPublishConfirmModal;
