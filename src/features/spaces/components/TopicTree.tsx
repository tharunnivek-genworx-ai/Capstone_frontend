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
import NodeDeleteConfirmModal from "./NodeDeleteConfirmModal";
import { getExcludedMoveTargetIds, findParentId, type MoveParentSelection } from "./moveTopicUtils";
import { mentorProgressService } from "../../mentor_progress_view";
import type { NodeDeletePreviewOut } from "../../mentor_progress_view/types/mentorProgress.types";
import { Layers3, Plus, Sparkles, X } from "lucide-react";

function collectSubtreeNodeIds(node: NodeTreeNode): string[] {
  return [node.node_id, ...node.children.flatMap(collectSubtreeNodeIds)];
}

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
  isCompact?: boolean;
  onGenerateAll?: () => void;
  isGenerateAllDisabled?: boolean;
  isGenerateAllSubmitting?: boolean;
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
  isCompact = false,
  onGenerateAll,
  isGenerateAllDisabled = false,
  isGenerateAllSubmitting = false,
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

  const [deleteTarget, setDeleteTarget] = useState<NodeTreeNode | null>(null);
  const [deletePreview, setDeletePreview] = useState<NodeDeletePreviewOut | null>(null);
  const [isLoadingDeletePreview, setIsLoadingDeletePreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleRequestDelete = async (node: NodeTreeNode) => {
    setDeleteTarget(node);
    setDeletePreview(null);
    setIsLoadingDeletePreview(true);
    try {
      const nodeIds = collectSubtreeNodeIds(node);
      const preview = await mentorProgressService.previewDeletedNodeContent(spaceId, nodeIds);
      setDeletePreview(preview);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Could not load delete preview.");
      setDeleteTarget(null);
    } finally {
      setIsLoadingDeletePreview(false);
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeletePreview(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onArchive(deleteTarget.node_id, { archive_children: deleteTarget.children.length > 0 });
      toast.success("Topic deleted.");
      setDeleteTarget(null);
      setDeletePreview(null);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Remove failed.");
    } finally {
      setIsDeleting(false);
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

  const excludedMoveIds = moveTarget ? getExcludedMoveTargetIds(moveTarget) : undefined;

  return (
    <div className="topic-tree">
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
        <>
          <div className="topic-tree__header">
            <div>
              <span className="topic-tree__eyebrow">Learning structure</span>
              <h2 className="topic-tree__heading">Topic Outline</h2>
            </div>
          </div>
          {isMentor && (
            <div className="topic-tree__primary-actions">
              <button
                type="button"
                className="topic-tree__generate-all-button"
                onClick={onGenerateAll}
                disabled={isGenerateAllDisabled || !onGenerateAll}
                title={
                  roots.length === 0
                    ? "Create at least one section first"
                    : "Generate materials across selected sections"
                }
              >
                <Sparkles size={18} aria-hidden="true" />
                <span>
                  <strong>
                    {isGenerateAllSubmitting ? "Starting generation…" : "Generate all study materials"}
                  </strong>
                  <small>Generate for all topics in this space</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openCreatePanel(null)}
                className="topic-tree__create-section-button"
                title="Create a new top-level section"
              >
                <Plus size={17} aria-hidden="true" />
                <span>Create New Section</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Inline create input (shows when createState is set) ── */}
      {createState !== null && (
        <div className="topic-tree__create-panel animate-fade-in">
          <p className="topic-tree__form-label">
            {createState.parentId
              ? `Adding subtopic under "${createState.parentTitle ?? "selected topic"}"`
              : "Adding new section"}
          </p>
          <form onSubmit={handleCreateSubmit} className="topic-tree__inline-form">
            <input
              autoFocus
              className="input-field"
              placeholder="Topic title…"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              maxLength={300}
              onKeyDown={(e) => {
                if (e.key === "Escape") setCreateState(null);
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isCreating || !createTitle.trim()}
            >
              {isCreating ? <span className="spinner topic-tree__small-spinner" /> : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setCreateState(null)}
              className="btn-secondary topic-tree__icon-button"
              aria-label="Cancel creating topic"
            >
              <X size={16} />
            </button>
          </form>
        </div>
      )}

      {/* ── Inline rename (modal-like, shown when renamingNode is set) ── */}
      {renamingNode && (
        <>
          <div onClick={() => setRenamingNode(null)} className="topic-tree-modal__backdrop" />
          <div className="topic-tree-modal__layer">
            <div
              className="topic-tree-modal animate-fade-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rename-topic-title"
            >
              <span className="topic-tree-modal__eyebrow">Edit outline</span>
              <h3 id="rename-topic-title" className="topic-tree-modal__title">
                Rename Topic
              </h3>
              <form onSubmit={handleRenameSubmit} className="topic-tree-modal__form">
                <input
                  autoFocus
                  className="input-field"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  maxLength={300}
                  onKeyDown={(e) => { if (e.key === "Escape") setRenamingNode(null); }}
                />
                <div className="topic-tree-modal__actions">
                  <button
                    type="button"
                    onClick={() => setRenamingNode(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
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
      {roots.length === 0 && createState === null ? (
        <div className="topic-tree-empty">
          <span className="topic-tree-empty__icon" aria-hidden="true"><Layers3 size={31} /></span>
          <h2>No topics yet</h2>
          <p>
            Start building your outline by adding the first section for this learning space.
          </p>
        </div>
      ) : (
        <div className="topic-tree__scroll" role="tree" aria-label="Topic outline">
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
              onArchive={handleRequestDelete}
              siblings={roots}
              isMentor={isMentor}
              movePickMode={!!moveTarget}
              movingNodeId={moveTarget?.node_id}
              excludedMoveTargetIds={excludedMoveIds}
              moveSelectedParentId={moveParentId}
              onPickMoveParent={(parentId) => setMoveParentId(parentId)}
              isCompact={isCompact}
            />
          ))}
        </div>
      )}

      {deleteTarget && deletePreview && (
        <NodeDeleteConfirmModal
          nodeTitle={deleteTarget.title}
          preview={deletePreview}
          onClose={closeDeleteModal}
          onConfirm={() => void handleConfirmDelete()}
          isSubmitting={isDeleting}
        />
      )}

      {deleteTarget && isLoadingDeletePreview && (
        <>
          <div className="topic-tree-modal__backdrop topic-tree-modal__backdrop--strong" />
          <div className="topic-tree-modal__layer topic-tree-modal__layer--front">
            <div className="topic-tree-modal__loading" role="status">
              <span className="spinner" />
              <span>Reviewing affected content…</span>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default TopicTree;
