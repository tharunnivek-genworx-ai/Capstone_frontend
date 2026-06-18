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
      <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0" }}>
        <span className="spinner" style={{ width: "1.1rem", height: "1.1rem", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "0.625rem",
        background: "#f8fafc",
        display: "flex",
        gap: "0.75rem",
        justifyContent: "space-between",
      }}
    >
      <CircularProgressStat
        label="Completion"
        percentage={progress.overall_progress_percentage}
        valueLabel={`${progress.overall_progress_percentage}%`}
        color="#2563eb"
        size={64}
      />
      <CircularProgressStat
        label="Score avg"
        percentage={progress.overall_score_percentage ?? 0}
        valueLabel={progress.overall_score_percentage == null ? "N/A" : `${progress.overall_score_percentage}%`}
        color="#16a34a"
        size={64}
      />
    </div>
  );
};

export default SpaceCardProgressPreview;

