import React from "react";
import { Layers3, Lock } from "lucide-react";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import TraineeTreeNode from "./TraineeTreeNode";

interface TraineeTopicTreeProps {
  roots: NodeTreeNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: NodeTreeNode) => void;
}

function hasUnpublishedNodes(nodes: NodeTreeNode[]): boolean {
  for (const node of nodes) {
    if (node.hasPublishedMaterial === false) return true;
    if (hasUnpublishedNodes(node.children)) return true;
  }
  return false;
}

const TraineeTopicTree: React.FC<TraineeTopicTreeProps> = ({
  roots,
  selectedNodeId,
  onSelectNode,
}) => {
  const showLegend = hasUnpublishedNodes(roots);

  return (
    <div className="topic-tree topic-tree--trainee">
      <div className="topic-tree__header">
        <div>
          <span className="topic-tree__eyebrow">Learning structure</span>
          <h2 className="topic-tree__heading">Topic Outline</h2>
        </div>
      </div>

      {roots.length === 0 && (
        <div className="topic-tree-empty topic-tree-empty--trainee">
          <span className="topic-tree-empty__icon" aria-hidden="true"><Layers3 size={31} /></span>
          <h2>No topics available yet</h2>
          <p>Your mentor is still preparing this learning space. Published topics will appear here.</p>
        </div>
      )}

      {showLegend && (
        <div className="topic-tree__lock-legend">
          <Lock size={13} />
          <span>Some topics are not yet available</span>
        </div>
      )}

      {roots.length > 0 && <div className="topic-tree__scroll" role="tree" aria-label="Topic outline">
        {roots.map((root) => (
          <TraineeTreeNode
            key={root.node_id}
            node={root}
            selectedNodeId={selectedNodeId}
            onSelect={onSelectNode}
          />
        ))}
      </div>}
    </div>
  );
};

export default TraineeTopicTree;
