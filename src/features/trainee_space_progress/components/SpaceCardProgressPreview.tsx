import React from "react";
import type { TraineeOwnSpaceProgressOut } from "../types/traineeSpaceProgress.types";
import CircularProgressStat from "./CircularProgressStat";

interface SpaceCardProgressPreviewProps {
  progress: TraineeOwnSpaceProgressOut | null;
  isLoading: boolean;
}

const SpaceCardProgressPreview: React.FC<SpaceCardProgressPreviewProps> = ({ progress, isLoading }) => {
  if (isLoading) {
    return (
      <div className="learning-progress-preview learning-progress-preview--loading">
        <span className="spinner" style={{ width: "1.1rem", height: "1.1rem", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="learning-progress-preview">
      <CircularProgressStat
        label="Completion"
        percentage={progress.overall_progress_percentage}
        valueLabel={`${progress.overall_progress_percentage}%`}
        color="var(--as-primary, #00535b)"
        size={64}
      />
      <CircularProgressStat
        label="Score avg"
        percentage={progress.overall_score_percentage ?? 0}
        valueLabel={progress.overall_score_percentage == null ? "N/A" : `${progress.overall_score_percentage}%`}
        color="var(--as-success, #236863)"
        size={64}
      />
    </div>
  );
};

export default SpaceCardProgressPreview;

