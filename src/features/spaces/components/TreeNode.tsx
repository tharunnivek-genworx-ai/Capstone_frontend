// src/features/spaces/components/TreeNode.tsx
/**
 * Single node row in the topic tree.
 * Handles expand/collapse, selection, hover action bar, and move-pick mode.
 */

import React, { useState } from "react";
import type { NodeTreeNode } from "../types/node.types";
import type { MoveParentSelection } from "./moveTopicUtils";

interface TreeNodeProps {
  node: NodeTreeNode;
  spaceId: string;
  selectedNodeId: string | null;
  onSelect: (node: NodeTreeNode) => void;
  onAddChild: (parentNode: NodeTreeNode) => void;
  onRename: (node: NodeTreeNode) => void;
  onMove: (node: NodeTreeNode) => void;
  onMoveUp: (node: NodeTreeNode) => void;
  onMoveDown: (node: NodeTreeNode) => void;
  onArchive: (node: NodeTreeNode) => void;
  siblings: NodeTreeNode[];
  isMentor?: boolean;
  movePickMode?: boolean;
  movingNodeId?: string;
  excludedMoveTargetIds?: Set<string>;
  moveSelectedParentId?: MoveParentSelection;
  onPickMoveParent?: (parentId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  selectedNodeId,
  onSelect,
  onAddChild,
  onRename,
  onMove,
  onMoveUp,
  onMoveDown,
  onArchive,
  siblings,
  isMentor = true,
  movePickMode = false,
  movingNodeId,
  excludedMoveTargetIds,
  moveSelectedParentId,
  onPickMoveParent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSelected = selectedNodeId === node.node_id;
  const hasChildren = node.children.length > 0;
  const siblingIndex = siblings.findIndex((s) => s.node_id === node.node_id);
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex >= 0 && siblingIndex < siblings.length - 1;

  const isMoveTargetExcluded = excludedMoveTargetIds?.has(node.node_id) ?? false;
  const isMoveTargetSelected = movePickMode && moveSelectedParentId === node.node_id;
  const isMovingNode = movePickMode && movingNodeId === node.node_id;
  const canPickAsParent = movePickMode && !isMoveTargetExcluded && onPickMoveParent;

  const handleRowClick = () => {
    if (canPickAsParent) {
      onPickMoveParent(node.node_id);
      return;
    }
    if (!movePickMode) {
      onSelect(node);
    }
  };

  const handleConfirmRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(node);
    setShowDeleteConfirm(false);
    setShowActions(false);
  };

  const rowBackground = isMoveTargetSelected
    ? "var(--color-primary-subtle)"
    : isMovingNode
    ? "var(--color-warning-subtle)"
    : isSelected && !movePickMode
    ? "var(--color-primary-subtle)"
    : "transparent";

  const rowBorder = isMoveTargetSelected
    ? "var(--color-primary)"
    : isMovingNode
    ? "var(--color-warning)"
    : isSelected && !movePickMode
    ? "var(--color-primary)"
    : "transparent";

  return (
    <div style={{ opacity: isMoveTargetExcluded && movePickMode ? 0.35 : 1 }}>
      <div
        onMouseEnter={() => !movePickMode && setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowDeleteConfirm(false);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.45rem 0.75rem 0.45rem 0.5rem",
          borderRadius: "var(--radius-lg)",
          cursor: canPickAsParent ? "pointer" : movePickMode && isMoveTargetExcluded ? "not-allowed" : "pointer",
          background: rowBackground,
          border: `1.5px solid ${rowBorder}`,
          transition: "background 0.12s, border-color 0.12s",
          userSelect: "none",
          position: "relative",
          minWidth: 0,
        }}
        onClick={handleRowClick}
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
            borderRadius: "var(--radius-sm)",
            color: hasChildren ? "var(--color-text-secondary)" : "transparent",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          tabIndex={hasChildren ? 0 : -1}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

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
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={node.level >= 3 ? "var(--color-text-muted)" : "#fff"} strokeWidth="2.5">
            {node.level === 1 ? (
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            ) : (
              <circle cx="12" cy="12" r="8" />
            )}
          </svg>
        </div>

        <span
          style={{
            flex: 1,
            fontSize: "0.875rem",
            fontWeight: isSelected || isMoveTargetSelected ? 600 : 500,
            color: isMoveTargetExcluded && movePickMode
              ? "var(--color-text-muted)"
              : isSelected || isMoveTargetSelected
              ? "var(--color-text-primary)"
              : "var(--color-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={node.title}
        >
          {node.title}
          {isMovingNode && (
            <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", color: "var(--color-warning)", fontWeight: 600 }}>
              (moving)
            </span>
          )}
        </span>

        {hasChildren && !showActions && !movePickMode && (
          <span
            style={{
              fontSize: "0.6875rem",
              color: "var(--color-text-muted)",
              background: "var(--color-bg-surface-alt)",
              padding: "0.1rem 0.4rem",
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
              fontWeight: 500,
            }}
          >
            {node.children.length}
          </span>
        )}

        {isMentor && showActions && !movePickMode && (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.125rem", flexShrink: 0, position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="tree-action-btn" title="Add a topic inside this one" onClick={(e) => { e.stopPropagation(); onAddChild(node); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              <span className="tree-action-btn__label">Add</span>
            </button>

            <button className="tree-action-btn" title="Rename this topic" onClick={(e) => { e.stopPropagation(); onRename(node); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              <span className="tree-action-btn__label">Rename</span>
            </button>

            <button className="tree-action-btn" title="Move to another location in the tree" onClick={(e) => { e.stopPropagation(); onMove(node); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l4 4 4-4" /><path d="M19 15l-4-4-4 4" />
              </svg>
              <span className="tree-action-btn__label">Move</span>
            </button>

            <button className="tree-action-btn" title="Move up" disabled={!canMoveUp} onClick={(e) => { e.stopPropagation(); if (canMoveUp) onMoveUp(node); }} style={{ opacity: canMoveUp ? 1 : 0.4, cursor: canMoveUp ? "pointer" : "not-allowed" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
            </button>

            <button className="tree-action-btn" title="Move down" disabled={!canMoveDown} onClick={(e) => { e.stopPropagation(); if (canMoveDown) onMoveDown(node); }} style={{ opacity: canMoveDown ? 1 : 0.4, cursor: canMoveDown ? "pointer" : "not-allowed" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            <div className="tree-action-divider" />

            {showDeleteConfirm ? (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.375rem",
                  zIndex: 30,
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.625rem 0.75rem",
                  boxShadow: "var(--shadow-subtle)",
                  minWidth: "220px",
                }}
              >
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  Remove {node.title}? This will also remove all its subtopics.
                </p>
                <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                  <button type="button" className="btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>Cancel</button>
                  <button type="button" className="btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", background: "var(--color-danger)", color: "#fff", border: "none" }} onClick={handleConfirmRemove}>Confirm</button>
                </div>
              </div>
            ) : (
              <button className="tree-action-btn tree-action-btn--danger" title="Remove this topic" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div style={{ marginLeft: "1.375rem", paddingLeft: "0.75rem", borderLeft: "1.5px solid var(--color-border)", marginTop: "1px" }}>
          {node.children.map((child) => (
            <TreeNode
              key={child.node_id}
              node={child}
              spaceId=""
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onMove={onMove}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onArchive={onArchive}
              siblings={node.children}
              isMentor={isMentor}
              movePickMode={movePickMode}
              movingNodeId={movingNodeId}
              excludedMoveTargetIds={excludedMoveTargetIds}
              moveSelectedParentId={moveSelectedParentId}
              onPickMoveParent={onPickMoveParent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
