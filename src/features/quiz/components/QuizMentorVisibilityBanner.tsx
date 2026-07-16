import React from "react";
import type { MentorStudentVisibilityOut } from "../../study_material/types/studyMaterial.types";

interface QuizMentorVisibilityBannerProps {
  visibility?: MentorStudentVisibilityOut | null;
  statusTag: { label: string; modifier: "draft" | "live" | "muted" };
  metaText: string;
  secondaryInfoLabel?: string;
  secondaryInfoValue?: string;
  actionLabel?: string;
  actionVariant?: "primary" | "danger";
  actionDisabled?: boolean;
  actionTitle?: string;
  onAction?: () => void;
  extraActions?: React.ReactNode;
}

const QuizMentorVisibilityBanner: React.FC<QuizMentorVisibilityBannerProps> = ({
  visibility,
  statusTag,
  metaText,
  secondaryInfoLabel,
  secondaryInfoValue,
  actionLabel,
  actionVariant = "primary",
  actionDisabled = false,
  actionTitle,
  onAction,
  extraActions,
}) => {
  const hasLiveMaterial = Boolean(visibility?.live_material_label);
  const hasLiveQuiz = Boolean(visibility?.live_quiz_title);

  const liveParts: string[] = [];
  if (hasLiveMaterial) {
    liveParts.push(visibility!.live_material_label!);
  }
  if (hasLiveQuiz) {
    liveParts.push(`Quiz: ${visibility!.live_quiz_title}`);
  }

  const showPrimaryAction = Boolean(actionLabel && (onAction || actionDisabled));
  const showActions = showPrimaryAction || Boolean(extraActions) || Boolean(metaText);
  const showSecondaryInfo = Boolean(secondaryInfoLabel && secondaryInfoValue);

  return (
    <div className="student-visibility-banner quiz-mentor-visibility-banner" role="status">
      <div className="student-visibility-banner__main">
        <div className="student-visibility-banner__row">
          <span className="student-visibility-banner__label">Students see:</span>
          <strong className="student-visibility-banner__value">
            {liveParts.length > 0 ? liveParts.join(" · ") : "Nothing on this topic yet"}
          </strong>
        </div>
        {showActions && (
          <div className="student-visibility-banner__actions">
            <span className="quiz-mentor-visibility-banner__meta" aria-label="Quiz draft details">
              <span className={`sm-version-tag sm-version-tag--${statusTag.modifier}`}>
                {statusTag.label}
              </span>
              <span className="quiz-mentor-visibility-banner__meta-text">{metaText}</span>
            </span>
            {extraActions}
            {showPrimaryAction && (
              <button
                type="button"
                className={`sm-mentor-btn sm-mentor-btn--${
                  actionVariant === "danger" ? "outline sm-mentor-btn--danger" : "primary"
                } student-visibility-banner__action`}
                onClick={onAction}
                disabled={actionDisabled}
                title={actionTitle}
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
      {showSecondaryInfo && (
        <div className="student-visibility-banner__row student-visibility-banner__row--secondary">
          <span className="student-visibility-banner__label">{secondaryInfoLabel}:</span>
          <span className="student-visibility-banner__value">{secondaryInfoValue}</span>
        </div>
      )}
    </div>
  );
};

export default QuizMentorVisibilityBanner;
