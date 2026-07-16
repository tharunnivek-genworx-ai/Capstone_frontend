import React from "react";
import type { RetentionMode, StudyMaterialUnpublishPreviewOut } from "../../types/studyMaterial.types";
import StudyMaterialLifecycleModal from "./StudyMaterialLifecycleModal";

interface StudyMaterialUnpublishConfirmModalProps {
  preview: StudyMaterialUnpublishPreviewOut;
  onClose: () => void;
  onConfirm: (retentionMode: RetentionMode) => void;
  isSubmitting: boolean;
  transactionError: string | null;
}

const StudyMaterialUnpublishConfirmModal: React.FC<StudyMaterialUnpublishConfirmModalProps> = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
  transactionError,
}) => {
  return (
    <StudyMaterialLifecycleModal
      title="Remove this material from students?"
      onClose={onClose}
      isSubmitting={isSubmitting}
    >
      {transactionError ? (
        <p className="sm-lifecycle-modal__error" role="alert">
          {transactionError}
        </p>
      ) : (
        <p className="sm-lifecycle-modal__intro">
          Choose what happens to <strong>{preview.version_label}</strong> for students.
        </p>
      )}

      <section className="sm-lifecycle-modal__impact-card" aria-label="Student impact">
        <h3>Students who engaged with this topic</h3>
        <ul>
          <li>
            <strong>{preview.trainees_read_count}</strong>
            {preview.trainees_read_count === 1 ? " student" : " students"} read this material
          </li>
          <li>
            <strong>{preview.trainees_quiz_attempt_count}</strong>
            {preview.trainees_quiz_attempt_count === 1 ? " student" : " students"} attempted the quiz
          </li>
        </ul>
      </section>

      {preview.has_live_quiz && (
        <div className="sm-lifecycle-modal__notice" role="note">
          <strong>Quiz visibility is independent.</strong>
          <span>
            The live quiz
            {preview.live_quiz_title ? ` (${preview.live_quiz_title})` : ""} is unchanged.
            Remove it separately on the Quiz tab if needed.
          </span>
        </div>
      )}

      {!transactionError && (
        <p className="sm-lifecycle-modal__guidance">
          Updating content? Publish a new version instead. The current edition can remain available
          in Previous versions.
        </p>
      )}

      <div className="sm-lifecycle-modal__choices">
        <button
          type="button"
          onClick={() => onConfirm("keep_for_review")}
          className="sm-lifecycle-choice sm-lifecycle-choice--primary"
          disabled={isSubmitting}
        >
          <strong>
            {isSubmitting ? "Removing…" : transactionError ? "Try again" : "Keep for student review"}
          </strong>
          {!isSubmitting && !transactionError && (
            <span>Students can still open this edition from Previous versions.</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onConfirm("remove_completely")}
          className="sm-lifecycle-choice sm-lifecycle-choice--danger"
          disabled={isSubmitting}
        >
          <strong>
            {isSubmitting ? "Removing…" : transactionError ? "Try again" : "Remove completely"}
          </strong>
          {!isSubmitting && !transactionError && (
            <span>Gone from students and not kept in Previous versions.</span>
          )}
        </button>
      </div>
    </StudyMaterialLifecycleModal>
  );
};

export default StudyMaterialUnpublishConfirmModal;
