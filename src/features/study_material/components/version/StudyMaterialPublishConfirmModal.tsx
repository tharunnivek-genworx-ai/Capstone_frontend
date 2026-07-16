import React from "react";
import type {
  RetentionMode,
  StudyMaterialPublishPreviewOut,
} from "../../types/studyMaterial.types";
import StudyMaterialLifecycleModal from "./StudyMaterialLifecycleModal";

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
    <StudyMaterialLifecycleModal
      title={title}
      onClose={onClose}
      isSubmitting={isSubmitting}
    >
      {transactionError ? (
        <p className="sm-lifecycle-modal__error" role="alert">
          {transactionError}
        </p>
      ) : (
        <>
          <p className="sm-lifecycle-modal__intro">{intro}</p>
          {impactBullets.length > 0 && (
            <ul className="sm-lifecycle-modal__impact-list">
              {impactBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {showSupersededChoices ? (
        <div className="sm-lifecycle-modal__choices">
          <button
            type="button"
            onClick={() => onConfirm("keep_for_review")}
            className="sm-lifecycle-choice sm-lifecycle-choice--primary"
            disabled={isSubmitting}
          >
            <strong>
              {isSubmitting ? "Making live…" : transactionError ? "Try again" : "Keep for student review"}
            </strong>
            {!isSubmitting && !transactionError && supersededLabel && (
              <span>{supersededLabel} stays available in Previous versions.</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onConfirm("remove_completely")}
            className="sm-lifecycle-choice sm-lifecycle-choice--danger"
            disabled={isSubmitting}
          >
            <strong>
              {isSubmitting ? "Making live…" : transactionError ? "Try again" : "Remove from students"}
            </strong>
            {!isSubmitting && !transactionError && supersededLabel && (
              <span>{supersededLabel} will not appear in Previous versions.</span>
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onConfirm()}
          className="sm-mentor-btn sm-mentor-btn--primary sm-lifecycle-modal__confirm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Making live…" : transactionError ? "Try again" : confirmLabel}
        </button>
      )}
    </StudyMaterialLifecycleModal>
  );
};

export default StudyMaterialPublishConfirmModal;
