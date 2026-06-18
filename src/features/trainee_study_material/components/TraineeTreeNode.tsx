import React, { useState } from "react";
import { Lock } from "lucide-react";
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
    <div>
      <div
        onClick={() => onSelect(node)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.45rem 0.75rem 0.45rem 0.5rem",
          borderRadius: "var(--radius-lg)",
          cursor: "pointer",
          background: isSelected ? "var(--color-primary-subtle)" : "transparent",
          border: `1.5px solid ${isSelected ? "var(--color-primary)" : "transparent"}`,
          opacity: isLockedLeaf ? 0.55 : 1,
          userSelect: "none",
        }}
        title={isLockedLeaf ? "Coming soon — tap to see alternatives" : node.title}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded((v) => !v);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: hasChildren ? "pointer" : "default",
            padding: "0.125rem",
            color: hasChildren ? "var(--color-text-secondary)" : "transparent",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
          tabIndex={hasChildren ? 0 : -1}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {isLockedLeaf ? (
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              background: "var(--color-bg-surface-alt)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Lock size={12} />
          </div>
        ) : (
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "5px",
              background:
                node.level === 1
                  ? "var(--color-primary)"
                  : node.level === 2
                  ? "var(--color-success)"
                  : "var(--color-bg-surface-alt)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: node.level >= 3 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke={node.level >= 3 ? "var(--color-text-muted)" : "#fff"}
              strokeWidth="2.5"
            >
              {node.level === 1 ? (
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              ) : (
                <circle cx="12" cy="12" r="8" />
              )}
            </svg>
          </div>
        )}

        <span
          style={{
            flex: 1,
            fontSize: "0.875rem",
            fontWeight: isSelected ? 600 : 500,
            color: isLockedLeaf
              ? "var(--color-text-muted)"
              : isSelected
              ? "var(--color-text-primary)"
              : "var(--color-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.title}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div
          style={{
            marginLeft: "1.375rem",
            paddingLeft: "0.75rem",
            borderLeft: "1.5px solid var(--color-border)",
          }}
        >
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
