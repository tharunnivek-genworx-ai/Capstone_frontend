import React from "react";
import type {
  RetentionMode,
  StudyMaterialPublishPreviewOut,
} from "../../types/studyMaterial.types";

type PublishModalMode = "first_publish" | "replace_live" | "restore_older";

interface StudyMaterialPublishConfirmModalProps {
  preview: StudyMaterialPublishPreviewOut;
  onClose: () => void;
  onConfirm: (supersededRetentionMode?: RetentionMode) => void;
  isSubmitting: boolean;
  transactionError: string | null;
}

function resolveMode(preview: StudyMaterialPublishPreviewOut): PublishModalMode {
  if (preview.is_republishing_older) return "restore_older";
  if (preview.is_replacing_live_version) return "replace_live";
  return "first_publish";
}

function buildIntro(
  preview: StudyMaterialPublishPreviewOut,
  mode: PublishModalMode,
): string {
  const prev = preview.previous_version_label ?? "the previous version";
  const next = preview.new_version_label;
  const current = preview.current_published_version_label ?? prev;

  switch (mode) {
    case "first_publish":
      return `${next} will become the live material students see on this topic.`;
    case "replace_live":
      return `${next} will replace what students see today. Choose what happens to ${prev}.`;
    case "restore_older":
      return `${next} will become live again. Choose what happens to ${current}.`;
  }
}

function buildImpactBullets(
  preview: StudyMaterialPublishPreviewOut,
  mode: PublishModalMode,
): string[] {
  if (mode === "first_publish") return [];

  const bullets: string[] = [];

  if (preview.will_reset_trainee_read_progress) {
    bullets.push("Students will need to re-read this topic from the start.");
  }

  bullets.push("The live quiz will not change unless you update it on the Quiz tab.");

  return bullets;
}

const titleByMode: Record<PublishModalMode, string> = {
  first_publish: "Make this live for students?",
  replace_live: "Replace what students see?",
  restore_older: "Restore an older live version?",
};

const confirmLabelByMode: Record<PublishModalMode, string> = {
  first_publish: "Make live",
  replace_live: "Replace live version",
  restore_older: "Restore as live",
};

function ModalHeader({
  title,
  onClose,
  isSubmitting,
}: {
  title: string;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="btn-secondary"
        style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", flexShrink: 0 }}
        disabled={isSubmitting}
      >
        Cancel
      </button>
    </div>
  );
}

const StudyMaterialPublishConfirmModal: React.FC<StudyMaterialPublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
  transactionError,
}) => {
  const mode = resolveMode(preview);
  const intro = buildIntro(preview, mode);
  const impactBullets = buildImpactBullets(preview, mode);
  const title = titleByMode[mode];
  const confirmLabel = confirmLabelByMode[mode];
  const showSupersededChoices = mode === "replace_live" || mode === "restore_older";
  const supersededLabel =
    mode === "restore_older"
      ? preview.current_published_version_label ?? preview.previous_version_label
      : preview.previous_version_label;

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
          <ModalHeader title={title} onClose={onClose} isSubmitting={isSubmitting} />
          <div style={{ padding: "1.5rem" }}>
            {transactionError ? (
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
                {transactionError}
              </p>
            ) : (
              <>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
                  {intro}
                </p>
                {impactBullets.length > 0 && (
                  <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                    {impactBullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {showSupersededChoices ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => onConfirm("keep_for_review")}
                  className="btn-primary"
                  style={{ width: "100%", padding: "0.625rem 1rem", textAlign: "left" }}
                  disabled={isSubmitting}
                >
                  <span style={{ display: "block", fontWeight: 600 }}>
                    {isSubmitting ? "Making live…" : transactionError ? "Try again" : "Move to previous version"}
                  </span>
                  {!isSubmitting && !transactionError && supersededLabel && (
                    <span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.8125rem", fontWeight: 400, opacity: 0.9 }}>
                      {supersededLabel} stays in Previous versions for students.
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm("remove_completely")}
                  className="btn-secondary"
                  style={{
                    width: "100%",
                    padding: "0.625rem 1rem",
                    textAlign: "left",
                    borderColor: "var(--color-danger, #e53e3e)",
                    color: "var(--color-danger, #e53e3e)",
                  }}
                  disabled={isSubmitting}
                >
                  <span style={{ display: "block", fontWeight: 600 }}>
                    {isSubmitting ? "Making live…" : transactionError ? "Try again" : "Remove this from students"}
                  </span>
                  {!isSubmitting && !transactionError && supersededLabel && (
                    <span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.8125rem", fontWeight: 400, opacity: 0.85 }}>
                      {supersededLabel} will not appear in Previous versions.
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onConfirm()}
                className="btn-primary"
                style={{ width: "100%", padding: "0.625rem 1rem" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Making live…" : transactionError ? "Try again" : confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudyMaterialPublishConfirmModal;
