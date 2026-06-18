import React from "react";
import { Lock } from "lucide-react";
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "0.875rem 1rem 0.625rem",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          Topic Outline
        </span>
      </div>

      {showLegend && (
        <div
          style={{
            margin: "0.5rem 0.75rem 0",
            padding: "0.45rem 0.6rem",
            borderRadius: "var(--radius-md)",
            border: "0.5px solid #e4e7ec",
            background: "#f7f8fa",
            color: "#6b7280",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Lock size={12} color="#9ca3af" />
          <span>Some topics are not yet available</span>
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.625rem 0.5rem 1rem",
        }}
      >
        {roots.map((root) => (
          <TraineeTreeNode
            key={root.node_id}
            node={root}
            selectedNodeId={selectedNodeId}
            onSelect={onSelectNode}
          />
        ))}
      </div>
    </div>
  );
};

export default TraineeTopicTree;
