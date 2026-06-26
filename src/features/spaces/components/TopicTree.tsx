// src/features/spaces/components/TopicTree.tsx
/**
 * Full topic tree panel.
 * Manages the tree-level state: drag node tracking, modal state,
 * sibling reorder on drop.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode, NodeCreateRequest, NodeRenameRequest } from "../types/node.types";
import TreeNode from "./TreeNode";
import MoveTopicOverlay from "./MoveTopicOverlay";
import { getExcludedMoveTargetIds, findParentId, type MoveParentSelection } from "./moveTopicUtils";

interface CreateNodeState {
  parentId: string | null; // null = root
  parentTitle: string | null;
}

interface TopicTreeProps {
  spaceId: string;
  roots: NodeTreeNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: NodeTreeNode) => void;
  onCreate: (spaceId: string, payload: NodeCreateRequest) => Promise<unknown>;
  onRename: (nodeId: string, payload: NodeRenameRequest) => Promise<unknown>;
  onMove: (spaceId: string, nodeId: string, payload: { new_parent_id: string | null; new_order_index?: number }) => Promise<void>;
  onReorder: (nodeId: string, direction: "up" | "down") => Promise<void>;
  onArchive: (nodeId: string, payload: { archive_children: boolean }) => Promise<void>;
  isMentor?: boolean;
  onMoveModeChange?: (active: boolean) => void;
}

const TopicTree: React.FC<TopicTreeProps> = ({
  spaceId,
  roots,
  selectedNodeId,
  onSelectNode,
  onCreate,
  onRename,
  onMove,
  onReorder,
  onArchive,
  isMentor = true,
  onMoveModeChange,
}) => {
  // ── Create node state ────────────────────────────────────────────────────
  const [createState, setCreateState] = useState<CreateNodeState | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // ── Rename inline (row-level rename via detail panel or row action) ───────
  const [renamingNode, setRenamingNode] = useState<NodeTreeNode | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // ── Move state ────────────────────────────────────────────────────────────
  const [moveTarget, setMoveTarget] = useState<NodeTreeNode | null>(null);
  const [moveParentId, setMoveParentId] = useState<MoveParentSelection>("__ROOT__");
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    onMoveModeChange?.(!!moveTarget);
  }, [moveTarget, onMoveModeChange]);

  // ────────────────────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────────────────────

  const openCreatePanel = (parentId: string | null, parentTitle: string | null = null) => {
    setCreateState({ parentId, parentTitle });
    setCreateTitle("");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || createState === null) return;
    setIsCreating(true);
    try {
      await onCreate(spaceId, {
        title: createTitle.trim(),
        parent_id: createState.parentId ?? undefined,
      });
      toast.success(createState.parentId ? "Subtopic added!" : "Root topic created!");
      setCreateState(null);
      setCreateTitle("");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to create topic.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingNode || !renameTitle.trim()) return;
    setIsRenaming(true);
    try {
      await onRename(renamingNode.node_id, { title: renameTitle.trim() });
      toast.success("Topic renamed!");
      setRenamingNode(null);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Rename failed.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleArchiveFromTree = async (node: NodeTreeNode) => {
    try {
      await onArchive(node.node_id, { archive_children: node.children.length > 0 });
      toast.success("Topic removed.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Remove failed.");
    }
  };

  const startMove = (node: NodeTreeNode) => {
    setMoveTarget(node);
    setMoveParentId(null);
  };

  const cancelMove = () => {
    setMoveTarget(null);
    setMoveParentId(null);
  };

  const confirmMove = async () => {
    if (!moveTarget) return;
    const newParentId = moveParentId === "__ROOT__" ? null : moveParentId;
    const currentParent = findParentId(roots, moveTarget.node_id);
    if (newParentId === currentParent) {
      cancelMove();
      return;
    }
    setIsMoving(true);
    try {
      await onMove(spaceId, moveTarget.node_id, { new_parent_id: newParentId });
      toast.success("Topic moved!");
      cancelMove();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Move failed.");
    } finally {
      setIsMoving(false);
    }
  };

  const handleMoveSibling = async (node: NodeTreeNode, direction: "up" | "down") => {
    try {
      await onReorder(node.node_id, direction);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Reorder failed.");
    }
  };

  // ── Empty state ───────────────────────────────────────────────────────────

  if (roots.length === 0 && createState === null) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))",
            border: "1px solid rgba(37,99,235,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 0.5rem",
          }}
        >
          No topics yet
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            margin: "0 0 1.75rem",
            lineHeight: 1.6,
            maxWidth: "280px",
          }}
        >
          Start building your outline by adding the first section for this learning space.
        </p>
        <button
          onClick={() => openCreatePanel(null)}
          className="btn-primary"
          style={{ padding: "0.75rem 1.5rem" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create New Section
        </button>
      </div>
    );
  }

  const excludedMoveIds = moveTarget ? getExcludedMoveTargetIds(moveTarget) : undefined;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {moveTarget && (
        <MoveTopicOverlay
          movingNode={moveTarget}
          selectedParentId={moveParentId}
          onSelectIndividualSpace={() => setMoveParentId("__ROOT__")}
          onConfirm={confirmMove}
          onCancel={cancelMove}
          isSubmitting={isMoving}
        />
      )}
      {/* ── Tree header ── */}
      {!moveTarget && (
        <div
          style={{
            padding: "0.875rem 1rem 0.625rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
          {isMentor && (
            <button
              onClick={() => openCreatePanel(null)}
              className="btn-primary"
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
                gap: "0.375rem",
              }}
              title="Create a new top-level section"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create New Section
            </button>
          )}
        </div>
      )}

      {/* ── Inline create input (shows when createState is set) ── */}
      {createState !== null && (
        <div
          className="animate-fade-in"
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-primary-subtle)",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-primary)",
              margin: "0 0 0.5rem",
            }}
          >
            {createState.parentId
              ? `Adding subtopic under "${createState.parentTitle ?? "selected topic"}"`
              : "Adding new section"}
          </p>
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              autoFocus
              className="input-field"
              placeholder="Topic title…"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              maxLength={300}
              style={{ flex: 1, fontSize: "0.875rem" }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setCreateState(null);
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "0.5rem 0.875rem", flexShrink: 0 }}
              disabled={isCreating || !createTitle.trim()}
            >
              {isCreating ? <span className="spinner" style={{ width: "1rem", height: "1rem" }} /> : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setCreateState(null)}
              className="btn-secondary"
              style={{ padding: "0.5rem", flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Inline rename (modal-like, shown when renamingNode is set) ── */}
      {renamingNode && (
        <>
          <div
            onClick={() => setRenamingNode(null)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          />
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <div
              className="animate-fade-in"
              style={{
                pointerEvents: "auto",
                width: "min(420px, 95vw)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                padding: "1.5rem",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              }}
            >
              <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Rename Topic
              </h3>
              <form onSubmit={handleRenameSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <input
                  autoFocus
                  className="input-field"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  maxLength={300}
                  onKeyDown={(e) => { if (e.key === "Escape") setRenamingNode(null); }}
                />
                <div style={{ display: "flex", gap: "0.625rem" }}>
                  <button
                    type="button"
                    onClick={() => setRenamingNode(null)}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2 }}
                    disabled={isRenaming || !renameTitle.trim()}
                  >
                    {isRenaming ? <><span className="spinner" />Saving…</> : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── Tree scroll area ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.625rem 0.5rem 1rem",
        }}
      >
        {roots.map((root) => (
          <TreeNode
            key={root.node_id}
            node={root}
            spaceId={spaceId}
            selectedNodeId={selectedNodeId}
            onSelect={onSelectNode}
            onAddChild={(n) => openCreatePanel(n.node_id, n.title)}
            onRename={(n) => { setRenamingNode(n); setRenameTitle(n.title); }}
            onMove={startMove}
            onMoveUp={(n) => handleMoveSibling(n, "up")}
            onMoveDown={(n) => handleMoveSibling(n, "down")}
            onArchive={handleArchiveFromTree}
            siblings={roots}
            isMentor={isMentor}
            movePickMode={!!moveTarget}
            movingNodeId={moveTarget?.node_id}
            excludedMoveTargetIds={excludedMoveIds}
            moveSelectedParentId={moveParentId}
            onPickMoveParent={(parentId) => setMoveParentId(parentId)}
          />
        ))}
      </div>

    </div>
  );
};

export default TopicTree;
