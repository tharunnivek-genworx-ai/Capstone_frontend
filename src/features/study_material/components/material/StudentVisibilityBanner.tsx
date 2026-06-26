import React from "react";
import type { MentorStudentVisibilityOut } from "../../types/studyMaterial.types";

interface StudentVisibilityBannerProps {
  visibility: MentorStudentVisibilityOut;
  onShowStudentArchive?: () => void;
}

const StudentVisibilityBanner: React.FC<StudentVisibilityBannerProps> = ({
  visibility,
  onShowStudentArchive,
}) => {
  const hasLiveMaterial = Boolean(visibility.live_material_label);
  const hasLiveQuiz = Boolean(visibility.live_quiz_title);
  const hasPrevious = visibility.previous_version_count > 0;

  const liveParts: string[] = [];
  if (hasLiveMaterial) {
    liveParts.push(visibility.live_material_label!);
  }
  if (hasLiveQuiz) {
    liveParts.push(`Quiz: ${visibility.live_quiz_title}`);
  }

  const archiveSummary =
    visibility.previous_version_count === 1
      ? "1 older version in student archive"
      : `${visibility.previous_version_count} older versions in student archive`;

  const firstLabel = visibility.previous_version_labels[0];
  const extraCount = visibility.previous_version_count - 1;
  const archiveDetail =
    firstLabel && extraCount > 0
      ? `${firstLabel} (+${extraCount} more)`
      : firstLabel ?? archiveSummary;

  return (
    <div className="student-visibility-banner" role="status">
      <div className="student-visibility-banner__row">
        <span className="student-visibility-banner__label">Students see:</span>
        <strong className="student-visibility-banner__value">
          {liveParts.length > 0 ? liveParts.join(" · ") : "Nothing on this topic yet"}
        </strong>
      </div>
      {hasPrevious && onShowStudentArchive && (
        <button
          type="button"
          className="student-visibility-banner__archive-link"
          onClick={onShowStudentArchive}
        >
          <span className="student-visibility-banner__label">Student archive:</span>
          <span className="student-visibility-banner__value">{archiveDetail}</span>
          <span className="student-visibility-banner__link-hint">View in sidebar →</span>
        </button>
      )}
      {hasPrevious && !onShowStudentArchive && (
        <div className="student-visibility-banner__row student-visibility-banner__row--secondary">
          <span className="student-visibility-banner__label">Student archive:</span>
          <span className="student-visibility-banner__value">{archiveDetail}</span>
        </div>
      )}
    </div>
  );
};

export default StudentVisibilityBanner;
