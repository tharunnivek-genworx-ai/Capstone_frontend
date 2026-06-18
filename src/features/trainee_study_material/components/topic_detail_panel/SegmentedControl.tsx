import React from "react";
import type { MixedParentTab } from "../../types/traineeNodePanel.types";

interface SegmentedControlProps {
  activeTab: MixedParentTab;
  subtopicCount: number;
  onChange: (tab: MixedParentTab) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  activeTab,
  subtopicCount,
  onChange,
}) => (
  <div className="topic-detail-panel__seg-control" role="tablist" aria-label="Topic sections">
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === "study"}
      className={`topic-detail-panel__seg-btn ${
        activeTab === "study" ? "topic-detail-panel__seg-btn--active" : ""
      }`}
      onClick={() => onChange("study")}
    >
      <i className="ti ti-file-text" aria-hidden="true" style={{ fontSize: 13 }} />
      Study material
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === "subtopics"}
      className={`topic-detail-panel__seg-btn ${
        activeTab === "subtopics" ? "topic-detail-panel__seg-btn--active" : ""
      }`}
      onClick={() => onChange("subtopics")}
    >
      <i className="ti ti-layout-list" aria-hidden="true" style={{ fontSize: 13 }} />
      Subtopics ({subtopicCount})
    </button>
  </div>
);

export default SegmentedControl;
