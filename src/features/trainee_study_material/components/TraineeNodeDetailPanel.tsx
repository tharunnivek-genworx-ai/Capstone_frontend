import React from "react";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import TopicDetailPanel from "./topic_detail_panel/TopicDetailPanel";
import "../styles/topicDetailPanel.css";

interface TraineeNodeDetailPanelProps {
  node: NodeTreeNode | null;
  spaceId: string;
  onNavigateToNode: (nodeId: string) => void;
}

const TraineeNodeDetailPanel: React.FC<TraineeNodeDetailPanelProps> = ({
  node,
  spaceId,
  onNavigateToNode,
}) => {
  if (!node) {
    return (
      <div className="topic-detail-panel topic-detail-panel--empty">
        <p>Select a topic from your outline</p>
      </div>
    );
  }

  return (
    <TopicDetailPanel
      key={node.node_id}
      node={node}
      spaceId={spaceId}
      onNavigate={onNavigateToNode}
    />
  );
};

export default TraineeNodeDetailPanel;
