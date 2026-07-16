import React from "react";
import { AlertTriangle, BookOpen, FileQuestion, Trash2 } from "lucide-react";
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
        className="topic-tree-modal__backdrop topic-tree-modal__backdrop--strong"
      />
      <div className="topic-tree-modal__layer topic-tree-modal__layer--front">
        <div
          className="topic-delete-modal animate-fade-in"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-topic-title"
          aria-describedby="delete-topic-description"
        >
          <div className="topic-delete-modal__header">
            <div className="topic-delete-modal__icon">
              <Trash2 size={21} />
            </div>
            <div>
              <span className="topic-tree-modal__eyebrow">Delete from outline</span>
              <h2 id="delete-topic-title" className="topic-delete-modal__title">
                Delete this topic?
              </h2>
              <p className="topic-delete-modal__topic" title={nodeTitle}>
                &ldquo;{nodeTitle}&rdquo;
              </p>
            </div>
          </div>

          <div className="topic-delete-modal__body">
            <p id="delete-topic-description" className="topic-delete-modal__description">
              Students will no longer be able to see live content on{" "}
              {preview.topic_count === 1 ? "this topic" : `these ${preview.topic_count} ${topicNoun}`}.
              {preview.topic_count > 1 ? " All subtopics will be deleted as well." : null}
            </p>

            <div className="topic-delete-modal__impact-grid">
              <div className="topic-delete-modal__impact">
                <BookOpen size={18} aria-hidden="true" />
                <p className="topic-delete-modal__impact-label">
                  Live study material
                </p>
                <p className="topic-delete-modal__impact-count">
                  {preview.live_study_material_count}
                </p>
                <p className="topic-delete-modal__impact-copy">
                  published {materialNoun}
                </p>
              </div>

              <div className="topic-delete-modal__impact">
                <FileQuestion size={18} aria-hidden="true" />
                <p className="topic-delete-modal__impact-label">
                  Live quizzes
                </p>
                <p className="topic-delete-modal__impact-count">
                  {preview.live_quiz_count}
                </p>
                <p className="topic-delete-modal__impact-copy">
                  published {quizNoun}
                </p>
              </div>
            </div>

            {(preview.live_study_material_count > 0 || preview.live_quiz_count > 0) && (
              <div className="topic-delete-modal__warning">
                <AlertTriangle size={17} aria-hidden="true" />
                <p>
                  This will remove {preview.live_study_material_count} live {materialNoun} and{" "}
                  {preview.live_quiz_count} live {quizNoun} from student view immediately.
                </p>
              </div>
            )}

            <div className="topic-delete-modal__actions">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-danger"
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
