import React from "react";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import TopicDetailPanel from "./topic_detail_panel/TopicDetailPanel";
import "../styles/topicDetailPanel.css";
import { FileText } from "lucide-react";

interface TraineeNodeDetailPanelProps {
  node: NodeTreeNode | null;
  hasTopics?: boolean;
  spaceId: string;
  onNavigateToNode: (nodeId: string) => void;
}

const TraineeNodeDetailPanel: React.FC<TraineeNodeDetailPanelProps> = ({
  node,
  hasTopics = true,
  spaceId,
  onNavigateToNode,
}) => {
  if (!node) {
    return (
      <section className="topic-detail-panel topic-detail-panel--empty content-canvas-empty" aria-labelledby="trainee-content-canvas-title">
        <div className="content-canvas-empty__paper-stack" aria-hidden="true">
          <div className="content-canvas-empty__paper">
            <FileText size={56} strokeWidth={1.2} />
          </div>
        </div>
        <h2 id="trainee-content-canvas-title">Learning Canvas</h2>
        <p>
          {hasTopics
            ? "Select an available topic from the outline to open its lesson, resources, and activities."
            : "Your mentor is still preparing this learning space. Lessons will appear here when topics are published."}
        </p>
      </section>
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
