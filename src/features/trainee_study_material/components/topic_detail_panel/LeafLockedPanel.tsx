import React from "react";
import type { TraineeNodePanelOut } from "../../types/traineeNodePanel.types";
import TopicPanelHeader from "./TopicPanelHeader";
import ComingSoonBanner from "./ComingSoonBanner";

interface LeafLockedPanelProps {
  panel: TraineeNodePanelOut;
  onNavigate: (nodeId: string) => void;
}

const LeafLockedPanel: React.FC<LeafLockedPanelProps> = ({ panel, onNavigate }) => (
  <div className="topic-detail-panel__scroll">
    <TopicPanelHeader
      title={panel.title}
      breadcrumbs={panel.breadcrumbs}
      backNavigation={panel.back_navigation}
      onNavigate={onNavigate}
    />
    <ComingSoonBanner
      siblingSuggestions={panel.sibling_suggestions}
      onNavigate={onNavigate}
    />
  </div>
);

export default LeafLockedPanel;
