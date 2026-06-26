import React from "react";
import type { MaterialTab } from "../../types/traineeNodePanel.types";

interface MaterialVersionTabsProps {
  activeTab: MaterialTab;
  previousCount: number;
  onChange: (tab: MaterialTab) => void;
}

const MaterialVersionTabs: React.FC<MaterialVersionTabsProps> = ({
  activeTab,
  previousCount,
  onChange,
}) => (
  <div className="topic-detail-panel__seg-control" role="tablist" aria-label="Material versions">
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === "current"}
      className={`topic-detail-panel__seg-btn ${
        activeTab === "current" ? "topic-detail-panel__seg-btn--active" : ""
      }`}
      onClick={() => onChange("current")}
    >
      Current
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === "previous"}
      className={`topic-detail-panel__seg-btn ${
        activeTab === "previous" ? "topic-detail-panel__seg-btn--active" : ""
      }`}
      onClick={() => onChange("previous")}
    >
      Previous versions ({previousCount})
    </button>
  </div>
);

export default MaterialVersionTabs;
