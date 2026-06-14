import React, { useState } from "react";
import type { StudyMaterialFeedbackMode } from "../types/studyMaterial.types";

// Re-export for backward compatibility
export type { StudyMaterialFeedbackMode };

interface StudyMaterialFeedbackModalProps {
  mode: StudyMaterialFeedbackMode;
  nodeTitle: string;
  versionLabel: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

const COPY: Record<
  StudyMaterialFeedbackMode,
  { title: string; description: string; placeholder: string; submit: string }
> = {
  regenerate: {
    title: "Regenerate study material",
    description:
      "Describe what is wrong with the current draft and what should change. The AI will rewrite the material using your active version as context — reference PDF parsing will not run again.",
    placeholder:
      "e.g. Section 3 is too shallow. Add more step-by-step detail for the deployment workflow and keep the existing diagram explanations.",
    submit: "Regenerate",
  },
  improve: {
    title: "Improve study material",
    description:
      "Give targeted feedback. The AI will apply only the changes you request while keeping the rest of the draft intact.",
    placeholder:
      "e.g. Simplify the language in Section 2 and add a short code example for the config file mentioned in step 4.",
    submit: "Improve",
  },
};

const MIN_LENGTH = 10;

const StudyMaterialFeedbackModal: React.FC<StudyMaterialFeedbackModalProps> = ({
  mode,
  nodeTitle,
  versionLabel,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [feedback, setFeedback] = useState("");
  const copy = COPY[mode];
  const trimmed = feedback.trim();
  const canSubmit = trimmed.length >= MIN_LENGTH && !isSubmitting;

  return (
    <div
      className="study-material-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div className="study-material-modal" role="dialog" aria-modal="true">
        <div className="study-material-modal__header">
          <div>
            <h3 className="study-material-modal__title">{copy.title}</h3>
            <p className="study-material-modal__subtitle">
              {nodeTitle}
              {versionLabel ? ` · ${versionLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="study-material-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="study-material-modal__body">
          <p className="study-material-modal__description">{copy.description}</p>
          <label htmlFor="study-material-feedback" className="label">
            Your instructions
          </label>
          <textarea
            id="study-material-feedback"
            className="input-field"
            rows={6}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={copy.placeholder}
            disabled={isSubmitting}
            style={{ resize: "vertical", minHeight: "140px" }}
          />
          <p className="study-material-modal__hint">
            Minimum {MIN_LENGTH} characters ({trimmed.length}/{MIN_LENGTH})
          </p>
        </div>

        <div className="study-material-modal__footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSubmit(trimmed)}
            disabled={!canSubmit}
            style={{ minWidth: "120px" }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" /> Working…
              </>
            ) : (
              copy.submit
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialFeedbackModal;
