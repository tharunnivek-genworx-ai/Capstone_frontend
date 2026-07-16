import React, { useState } from "react";
import { ChevronDown, ChevronRight, Circle, Layers3, Lock } from "lucide-react";
import type { NodeTreeNode } from "../../spaces/types/node.types";

interface TraineeTreeNodeProps {
  node: NodeTreeNode;
  selectedNodeId: string | null;
  onSelect: (node: NodeTreeNode) => void;
}

const TraineeTreeNode: React.FC<TraineeTreeNodeProps> = ({
  node,
  selectedNodeId,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.node_id;
  const isLockedLeaf = !hasChildren && node.hasPublishedMaterial === false;

  return (
    <div className="tree-node-branch">
      <div
        onClick={() => onSelect(node)}
        className={`tree-node trainee-tree-node${isSelected ? " tree-node--selected" : ""}${isLockedLeaf ? " trainee-tree-node--locked" : ""}`}
        title={isLockedLeaf ? "Coming soon — tap to see alternatives" : node.title}
        role="treeitem"
        aria-selected={isSelected}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(node);
          }
        }}
      >
        <button
          type="button"
          className="tree-node__chevron"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded((v) => !v);
          }}
          data-visible={hasChildren}
          tabIndex={hasChildren ? 0 : -1}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {isLockedLeaf ? (
          <div className="tree-node__icon trainee-tree-node__lock">
            <Lock size={12} />
          </div>
        ) : (
          <div className={`tree-node__icon tree-node__icon--level-${Math.min(node.level, 3)}`}>
            {node.level === 1 ? <Layers3 size={12} /> : <Circle size={10} />}
          </div>
        )}

        <span className="tree-node__title">
          {node.title}
        </span>
        {isLockedLeaf && <span className="trainee-tree-node__status">Coming soon</span>}
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-node__children" role="group">
          {node.children.map((child) => (
            <TraineeTreeNode
              key={child.node_id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TraineeTreeNode;
