import React from "react";
import type { StudyMaterialPublishPreviewOut } from "../types/studyMaterial.types";

type PublishModalMode = "draft_quizzes" | "published_quizzes_only" | "republish_older";

interface StudyMaterialPublishConfirmModalProps {
  preview: StudyMaterialPublishPreviewOut;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  transactionError: string | null;
}

function resolveMode(preview: StudyMaterialPublishPreviewOut): PublishModalMode {
  if (preview.is_republishing_older) return "republish_older";
  if (preview.has_draft_quizzes) return "draft_quizzes";
  return "published_quizzes_only";
}

const StudyMaterialPublishConfirmModal: React.FC<StudyMaterialPublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
  transactionError,
}) => {
  const mode = resolveMode(preview);
  const prev = preview.previous_version_label ?? "the previous version";
  const next = preview.new_version_label;
  const current = preview.current_published_version_label ?? prev;

  const title =
    mode === "republish_older"
      ? "Re-publish an older version?"
      : mode === "draft_quizzes"
        ? "Publishing will delete your quiz draft"
        : "Publishing will unpublish the current quiz";

  const body =
    mode === "republish_older"
      ? `You are re-publishing ${next}. The current published version (${current}) will be unpublished. Any quiz drafts linked to ${current} will be deleted and their hints removed. The quiz previously generated for ${next} — if it exists — will become available again.`
      : mode === "draft_quizzes"
        ? `You have a quiz draft linked to ${prev}. Publishing ${next} will permanently delete that draft and its hints and unpublish any published quizzes for ${prev}. You will need to generate a new quiz for ${next}.`
        : `The quiz linked to ${prev} will be unpublished and its hints removed from trainee view. Trainees will not see a quiz for this node until you generate and publish a new one for ${next}.`;

  const confirmLabel =
    mode === "republish_older"
      ? `Re-publish ${next.split(" ")[0]}`
      : mode === "draft_quizzes"
        ? "Delete Draft & Publish"
        : "Publish Anyway";

  const confirmClass = mode === "draft_quizzes" ? "btn-danger" : "btn-primary";

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
            width: "min(480px, 95vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              {transactionError ?? body}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={confirmClass}
                style={{ flex: 1, padding: "0.625rem 1rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Publishing…" : transactionError ? "Try Again" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudyMaterialPublishConfirmModal;
