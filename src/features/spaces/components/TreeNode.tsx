// src/features/spaces/components/TreeNode.tsx
/**
 * Single node row in the topic tree.
 * Handles expand/collapse, selection, the accessible action menu, and move-pick mode.
 */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Layers3,
  MoreVertical,
  Move,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
  isCompact?: boolean;
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
  isCompact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodeId === node.node_id;
  const hasChildren = node.children.length > 0;
  const siblingIndex = siblings.findIndex((s) => s.node_id === node.node_id);
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex >= 0 && siblingIndex < siblings.length - 1;

  const isMoveTargetExcluded = excludedMoveTargetIds?.has(node.node_id) ?? false;
  const isMoveTargetSelected = movePickMode && moveSelectedParentId === node.node_id;
  const isMovingNode = movePickMode && movingNodeId === node.node_id;
  const canPickAsParent = movePickMode && !isMoveTargetExcluded && onPickMoveParent;

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      const target = event.target as globalThis.Node;
      if (!menuRef.current?.contains(target) && !menuButtonRef.current?.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    const closeOnViewportChange = () => setIsMenuOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    });

    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [isMenuOpen]);

  const handleRowClick = () => {
    if (canPickAsParent) {
      onPickMoveParent(node.node_id);
      return;
    }
    if (!movePickMode) {
      onSelect(node);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(node);
    setIsMenuOpen(false);
  };

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    setMenuPosition({
      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 294)),
      left: Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8),
    });
    setIsMenuOpen(true);
  };

  const runMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [],
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Home") items[0].focus();
    else if (event.key === "End") items.at(-1)?.focus();
    else {
      const offset = event.key === "ArrowDown" ? 1 : -1;
      items[(currentIndex + offset + items.length) % items.length].focus();
    }
  };

  const stateClasses = [
    isCompact && "tree-node--compact",
    isSelected && !movePickMode && "tree-node--selected",
    isMoveTargetSelected && "tree-node--move-selected",
    isMovingNode && "tree-node--moving",
    isMoveTargetExcluded && movePickMode && "tree-node--excluded",
    isMenuOpen && "tree-node--menu-open",
  ].filter(Boolean).join(" ");

  return (
    <div className="tree-node-branch">
      <div
        className={`tree-node ${stateClasses}`}
        style={{ cursor: canPickAsParent ? "pointer" : movePickMode && isMoveTargetExcluded ? "not-allowed" : "pointer" }}
      >
        <div className="tree-node__track">
          <div
            className="tree-node__select"
            onClick={handleRowClick}
            role="treeitem"
            aria-selected={isSelected}
            aria-disabled={isMoveTargetExcluded && movePickMode}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleRowClick();
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
            aria-label={isExpanded ? "Collapse" : "Expand"}
            tabIndex={hasChildren ? 0 : -1}
          >
            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          <div className={`tree-node__icon tree-node__icon--level-${Math.min(node.level, 3)}`}>
            {node.level === 1 ? <Layers3 size={12} /> : <Circle size={10} />}
          </div>

          <span
            className="tree-node__title"
            title={node.title}
          >
            {node.title}
            {isMovingNode && (
              <span className="tree-node__moving-label">
                (moving)
              </span>
            )}
          </span>

          {hasChildren && !isMenuOpen && !movePickMode && (
            <span className="tree-node__child-count">
              {node.children.length}
            </span>
          )}
          </div>

          {isMentor && !movePickMode && (
            <button
              ref={menuButtonRef}
              type="button"
              className="tree-node__menu-trigger"
              title={`Actions for ${node.title}`}
              aria-label={`Actions for ${node.title}`}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={openMenu}
            >
              <MoreVertical size={17} />
            </button>
          )}
        </div>
      </div>

      {isMenuOpen && createPortal(
        <div className="learning-experience learning-portal">
          <div
            ref={menuRef}
            className="tree-node-menu"
            role="menu"
            aria-label={`Actions for ${node.title}`}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onKeyDown={handleMenuKeyDown}
          >
            <button type="button" role="menuitem" onClick={() => runMenuAction(() => onAddChild(node))}>
              <Plus size={16} /><span>Add subtopic</span>
            </button>
            <button type="button" role="menuitem" onClick={() => runMenuAction(() => onRename(node))}>
              <Pencil size={15} /><span>Rename</span>
            </button>
            <button type="button" role="menuitem" onClick={() => runMenuAction(() => onMove(node))}>
              <Move size={15} /><span>Move to…</span>
            </button>
            <div className="tree-node-menu__separator" role="separator" />
            <button type="button" role="menuitem" disabled={!canMoveUp} onClick={() => runMenuAction(() => onMoveUp(node))}>
              <ChevronUp size={16} /><span>Move up</span>
            </button>
            <button type="button" role="menuitem" disabled={!canMoveDown} onClick={() => runMenuAction(() => onMoveDown(node))}>
              <ChevronDown size={16} /><span>Move down</span>
            </button>
            <div className="tree-node-menu__separator" role="separator" />
            <button type="button" role="menuitem" className="tree-node-menu__danger" onClick={handleDeleteClick}>
              <Trash2 size={15} /><span>Delete</span>
            </button>
          </div>
        </div>,
        document.body,
      )}

      {hasChildren && isExpanded && (
        <div className="tree-node__children" role="group">
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
              isCompact={isCompact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
