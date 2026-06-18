import React from "react";
import type { QuizBadgeKind } from "../../types/traineeNodePanel.types";

interface ProgressBarProps {
  readPercent: number;
  quizBadgeKind?: QuizBadgeKind;
  quizBadgeLabel?: string | null;
}

const BADGE_CLASS: Record<Exclude<QuizBadgeKind, "none">, string> = {
  not_taken: "topic-detail-panel__badge--quiz-pending",
  in_progress: "topic-detail-panel__badge--quiz-progress",
  completed: "topic-detail-panel__badge--quiz-done",
};

const BADGE_ICON: Record<Exclude<QuizBadgeKind, "none">, string> = {
  not_taken: "ti-circle-dashed",
  in_progress: "ti-player-pause",
  completed: "ti-check",
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  readPercent,
  quizBadgeKind = "none",
  quizBadgeLabel = null,
}) => (
  <div className="topic-detail-panel__progress-row">
    <div className="topic-detail-panel__progress-track">
      <div
        className="topic-detail-panel__progress-fill"
        style={{ width: `${readPercent}%` }}
      />
    </div>
    <span className="topic-detail-panel__progress-label">Read {readPercent}%</span>
    {quizBadgeKind !== "none" && quizBadgeLabel && (
      <span className={`topic-detail-panel__badge ${BADGE_CLASS[quizBadgeKind]}`}>
        <i className={`ti ${BADGE_ICON[quizBadgeKind]}`} aria-hidden="true" style={{ fontSize: 12 }} />
        {quizBadgeLabel}
      </span>
    )}
  </div>
);

export default ProgressBar;
