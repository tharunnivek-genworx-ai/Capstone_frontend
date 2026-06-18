import React from "react";
import type { OverallProgress } from "../../types/traineeNodePanel.types";

interface OverallProgressFooterProps {
  progress: OverallProgress;
}

const OverallProgressFooter: React.FC<OverallProgressFooterProps> = ({ progress }) => (
  <div className="topic-detail-panel__overall">
    <i
      className="ti ti-player-play topic-detail-panel__muted-icon"
      aria-hidden="true"
      style={{ fontSize: 18, color: "#185fa5" }}
    />
    <div className="topic-detail-panel__overall-text">
      <p className="topic-detail-panel__overall-title">Your overall progress</p>
      <p className="topic-detail-panel__overall-meta">{progress.label}</p>
    </div>
    <div className="topic-detail-panel__overall-pct">
      <div className="topic-detail-panel__overall-value">{progress.percentage}%</div>
      <div className="topic-detail-panel__overall-unit">overall</div>
    </div>
  </div>
);

export default OverallProgressFooter;
