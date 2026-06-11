// src/features/spaces/components/MoveNodeModal.tsx
/**
 * Modal for reparenting a node (move to another parent or promote to root).
 * Shows the flattened tree excluding the node being moved and its descendants.
 * Calls PATCH /nodes/{node_id}/reparent.
 */

import React, { useMemo, useState } from "react";
import type { NodeTreeNode } from "../types/node.types";

interface MoveNodeModalProps {
  movingNode: NodeTreeNode;
  roots: NodeTreeNode[];
  onClose: () => void;
  onMove: (newParentId: string | null, newOrderIndex?: number) => void;
  isSubmitting?: boolean;
}

interface FlatNode {
  node: NodeTreeNode;
  depth: number;
}

/**
 * Flatten tree, excluding the moving node and all its descendants.
 */
function flattenExcluding(nodes: NodeTreeNode[], excludeId: string, depth = 0): FlatNode[] {
  const result: FlatNode[] = [];
  for (const n of nodes) {
    if (n.node_id === excludeId) continue; // skip this node and its subtree
    result.push({ node: n, depth });
    result.push(...flattenExcluding(n.children, excludeId, depth + 1));
  }
  return result;
}

const MoveNodeModal: React.FC<MoveNodeModalProps> = ({
  movingNode,
  roots,
  onClose,
  onMove,
  isSubmitting = false,
}) => {
  const [selectedParentId, setSelectedParentId] = useState<string | null | "__ROOT__">("__ROOT__");

  const flatNodes = useMemo(
    () => flattenExcluding(roots, movingNode.node_id),
    [roots, movingNode.node_id]
  );

  const handleConfirm = () => {
    const newParentId = selectedParentId === "__ROOT__" ? null : (selectedParentId as string);
    onMove(newParentId);
  };

  const isRoot = selectedParentId === "__ROOT__";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal Center Wrapper */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        {/* Modal */}
        <div
          className="animate-fade-in"
          style={{
            pointerEvents: "auto",
            width: "min(500px, 95vw)",
            maxHeight: "80vh",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Move Topic
            </h2>
            <p
              style={{
                margin: "0.125rem 0 0",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              Select a new parent for{" "}
              <strong style={{ color: "var(--color-text-secondary)" }}>
                "{movingNode.title}"
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "0.25rem",
            }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tree picker */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem" }}>
          {/* Promote to Root option */}
          <button
            onClick={() => setSelectedParentId("__ROOT__")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 0.875rem",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${isRoot ? "var(--color-primary)" : "var(--color-border)"}`,
              background: isRoot ? "rgba(37,99,235,0.1)" : "var(--color-surface)",
              cursor: "pointer",
              marginBottom: "0.5rem",
              textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: isRoot ? "var(--color-primary)" : "var(--color-surface-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                Make Root Topic
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                No parent — top-level topic
              </p>
            </div>
            {isRoot && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                style={{ marginLeft: "auto" }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Separator */}
          {flatNodes.length > 0 && (
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "0.5rem 0.25rem 0.375rem",
                margin: 0,
              }}
            >
              Or choose a parent topic
            </p>
          )}

          {/* Flat tree list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {flatNodes.map(({ node, depth }) => {
              const isSelected = selectedParentId === node.node_id;
              return (
                <button
                  key={node.node_id}
                  onClick={() => setSelectedParentId(node.node_id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 0.75rem",
                    paddingLeft: `${0.75 + depth * 1.25}rem`,
                    borderRadius: "var(--radius-md)",
                    border: `1.5px solid ${isSelected ? "var(--color-primary)" : "transparent"}`,
                    background: isSelected ? "rgba(37,99,235,0.1)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Depth indicator dots */}
                  {depth > 0 && (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--color-surface-3)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                      fontWeight: isSelected ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {node.title}
                  </span>
                  {isSelected && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="2.5"
                      style={{ marginLeft: "auto", flexShrink: 0 }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}

            {flatNodes.length === 0 && !isRoot && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  padding: "1rem",
                }}
              >
                No other topics available.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: "0.75rem",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1 }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary"
            style={{ flex: 2 }}
            disabled={isSubmitting || selectedParentId === null}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Moving…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 9l4 4 4-4M9 13V5" />
                  <path d="M19 15l-4-4-4 4M15 11v8" />
                </svg>
                Move Topic
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default MoveNodeModal;
