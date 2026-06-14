// src/features/spaces/components/SpaceDetailPage.tsx
/**
 * Space detail page: two-panel layout with topic tree + node detail.
 * Header shows space name, department, invite code copy, and publish toggle.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { spaceService } from "../services/spaceService";
import { useTopicTree } from "../hooks/useTopicTree";
import type { SpaceResponse } from "../types/space.types";
import type { NodeTreeNode, NodeUpdateInstructionRequest } from "../types/node.types";
import type { NodeStudyState, NodeStudyStatePatch } from "../../study_material/types/studyMaterial.types";
import type { TopicContentPage } from "../types/node.types";
import TopicTree from "./TopicTree";
import NodeDetailPanel from "./NodeDetailPanel";
import InviteCodeModal from "./InviteCodeModal";
import ManageTraineesModal from "./ManageTraineesModal";
import { useAuth } from "../../auth/hooks/useAuth";

const SpaceDetailPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isMentor = role === "mentor";

  const [space, setSpace] = useState<SpaceResponse | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeTreeNode | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManageTrainees, setShowManageTrainees] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [treePanelWidth, setTreePanelWidth] = useState(340);
  const [nodeStudyStates, setNodeStudyStates] = useState<Map<string, NodeStudyState>>(new Map());

  // Return undefined for nodes never visited so useStudyMaterial can distinguish
  // "not yet loaded" (undefined) from "loaded, no material" (null) when deciding
  // whether to fetch reference material from the server.
  const getNodeStudyState = useCallback((nodeId: string): NodeStudyState | undefined => {
    return nodeStudyStates.get(nodeId);
  }, [nodeStudyStates]);

  const updateNodeStudyState = useCallback(
    (nodeId: string, patch: Partial<NodeStudyState>) => {
      setNodeStudyStates((prev) => {
        const existing = prev.get(nodeId) ?? {
          currentPage: 1 as TopicContentPage,
          hasTriggeredGeneration: false,
          studyMaterialContent: null,
          activeVersion: null,
          isGenerating: false,
          referenceMaterial: null,
        };
        const next = new Map(prev);
        next.set(nodeId, { ...existing, ...patch });
        return next;
      });
    },
    []
  );

  const selectedNodeId = selectedNode?.node_id ?? null;
  const handleStudyStateChange = useCallback(
    (patch: NodeStudyStatePatch) => {
      if (!selectedNodeId) return;
      updateNodeStudyState(selectedNodeId, patch);
    },
    [selectedNodeId, updateNodeStudyState]
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const {
    roots,
    isLoading: isLoadingTree,
    error: treeError,
    fetchTree,
    createNode,
    renameNode,
    updateNodeInstruction,
    reparentNode,
    reorderNodes,
    archiveNode,
    clearError: clearTreeError,
  } = useTopicTree();

  useEffect(() => {
    if (!spaceId) return;
    const load = async () => {
      setIsLoadingSpace(true);
      try {
        const [s] = await Promise.all([
          spaceService.getSpace(spaceId),
          fetchTree(spaceId),
        ]);
        setSpace(s);
        setEditName(s.space_name);
        setEditDesc(s.description ?? "");
      } catch (err) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to load space.");
        navigate(`/${role}/spaces`);
      } finally {
        setIsLoadingSpace(false);
      }
    };
    load();
  }, [spaceId]);

  useEffect(() => {
    if (treeError) {
      toast.error(treeError);
      clearTreeError();
    }
  }, [treeError]);

  // Keep selected node in sync after tree changes (e.g. move/reorder)
  useEffect(() => {
    if (!selectedNode || roots.length === 0) return;
    const findNode = (nodes: NodeTreeNode[], id: string): NodeTreeNode | null => {
      for (const n of nodes) {
        if (n.node_id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
      }
      return null;
    };
    const updated = findNode(roots, selectedNode.node_id);
    if (updated && updated !== selectedNode) {
      setSelectedNode(updated);
    }
  }, [roots, selectedNode?.node_id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const maxWidth = Math.max(320, rect.width * 0.7);
      const next = Math.min(maxWidth, Math.max(260, e.clientX - rect.left));
      setTreePanelWidth(next);
    };
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startTreeResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleCopyInvite = async () => {
    if (!space?.invite_code) return;
    try {
      await navigator.clipboard.writeText(space.invite_code);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — please copy manually.");
    }
  };

  const handlePublishToggle = async () => {
    if (!space || !spaceId) return;
    setIsPublishing(true);
    try {
      const updated = await spaceService.publishSpace(spaceId, {
        is_published: !space.is_published,
      });
      setSpace(updated);
      setShowUnpublishConfirm(false);
      toast.success(updated.is_published ? "Space published!" : "Space unpublished.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to update.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishClick = () => {
    if (!space) return;
    if (space.is_published) {
      setShowUnpublishConfirm(true);
    } else {
      handlePublishToggle();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await spaceService.updateSpace(spaceId, {
        space_name: editName.trim(),
        description: editDesc.trim() || null,
      });
      setSpace(updated);
      setIsEditingName(false);
      toast.success("Space updated!");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Update failed.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleNavigateToNode = useCallback((nodeId: string) => {
    const findNode = (nodes: NodeTreeNode[], id: string): NodeTreeNode | null => {
      for (const n of nodes) {
        if (n.node_id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
      }
      return null;
    };
    const node = findNode(roots, nodeId);
    if (node) setSelectedNode(node);
  }, [roots]);

  const handleNodeRename = useCallback(
    async (nodeId: string, newTitle: string) => {
      const updated = await renameNode(nodeId, { title: newTitle });
      // Keep selected node in sync
      if (selectedNode && selectedNode.node_id === nodeId) {
        setSelectedNode((prev) =>
          prev
            ? {
                ...prev,
                title: updated.title,
                effective_instruction: updated.effective_instruction,
                effective_instruction_parts: updated.effective_instruction_parts,
              }
            : prev
        );
      }
    },
    [renameNode, selectedNode]
  );

  const handleUpdateInstruction = useCallback(
    async (nodeId: string, payload: NodeUpdateInstructionRequest) => {
      const updated = await updateNodeInstruction(nodeId, payload);
      if (selectedNode && selectedNode.node_id === nodeId) {
        setSelectedNode((prev) =>
          prev
            ? {
                ...prev,
                node_specific_instruction: updated.node_specific_instruction,
                tree_default_instruction: updated.tree_default_instruction,
                node_additive_instruction: updated.node_additive_instruction,
                effective_instruction: updated.effective_instruction,
                effective_instruction_parts: updated.effective_instruction_parts,
              }
            : prev
        );
      }
    },
    [updateNodeInstruction, selectedNode]
  );

  if (isLoadingSpace) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span
          className="spinner"
          style={{
            borderTopColor: "var(--color-primary)",
            width: "2.5rem",
            height: "2.5rem",
          }}
        />
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Loading space…
        </p>
      </div>
    );
  }

  if (!space) return null;

  const moveBlurOverlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(247, 248, 250, 0.6)",
    backdropFilter: "blur(3px)",
    zIndex: 10,
    pointerEvents: "auto",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--color-bg-page)",
      }}
    >
      {/* ── Top header ── */}
      <header
        style={{
          padding: "0 1.5rem",
          height: "60px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "var(--color-bg-surface)",
          boxShadow: "var(--shadow-subtle)",
          flexShrink: 0,
          zIndex: 10,
          position: "relative",
        }}
      >
        {isMoveMode && <div style={moveBlurOverlay} aria-hidden />}
        {/* Back */}
        <button
          onClick={() => navigate(`/${role}/spaces`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "0.375rem",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          title="Back to spaces"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Space name / edit */}
        {isEditingName ? (
          <form
            onSubmit={handleSaveEdit}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}
          >
            <input
              autoFocus
              className="input-field"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ fontSize: "0.9375rem", fontWeight: 600, width: "220px" }}
              maxLength={200}
              onKeyDown={(e) => { if (e.key === "Escape") { setIsEditingName(false); setEditName(space.space_name); } }}
            />
            <input
              className="input-field"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              style={{ fontSize: "0.8125rem", width: "200px" }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "0.375rem 0.75rem", flexShrink: 0 }}
              disabled={isSavingEdit || !editName.trim()}
            >
              {isSavingEdit ? <span className="spinner" style={{ width: "1rem", height: "1rem" }} /> : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setIsEditingName(false); setEditName(space.space_name); }}
              className="btn-secondary"
              style={{ padding: "0.375rem 0.625rem", flexShrink: 0 }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {space.space_name}
              </h1>
              {space.description && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {space.description}
                </p>
              )}
            </div>
            {isMentor && (
              <button
                onClick={() => { setIsEditingName(true); setEditName(space.space_name); setEditDesc(space.description ?? ""); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "0.25rem",
                  borderRadius: "var(--radius-sm)",
                  flexShrink: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                title="Edit space name"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {isMentor && (
            <div style={{ position: "relative" }}>
              <button
                onClick={handlePublishClick}
                className={space.is_published ? "btn-danger" : "btn-primary"}
                style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <span
                    className="spinner"
                    style={{
                      borderTopColor: space.is_published ? "var(--color-danger)" : "var(--color-primary)",
                      width: "1rem",
                      height: "1rem",
                    }}
                  />
                ) : space.is_published ? (
                  "Unpublish"
                ) : (
                  "Publish Space"
                )}
              </button>
              {showUnpublishConfirm && (
                <>
                  <div
                    onClick={() => setShowUnpublishConfirm(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 0.5rem)",
                      right: 0,
                      zIndex: 50,
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "0.875rem 1rem",
                      boxShadow: "var(--shadow-subtle)",
                      minWidth: "260px",
                    }}
                  >
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                      This will hide the space from trainees. Continue?
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
                        onClick={() => setShowUnpublishConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", background: "var(--color-danger)", color: "#fff", border: "none" }}
                        onClick={handlePublishToggle}
                        disabled={isPublishing}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Invite code */}
          {isMentor && space.invite_code && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem 0.25rem 0.875rem",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
              onClick={handleCopyInvite}
              title="Click to copy invite code"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <code
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--color-primary)",
                  fontFamily: "monospace",
                }}
              >
                {space.invite_code}
              </code>
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </div>
          )}

          {/* Share invite code button */}
          {isMentor && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-secondary"
              style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              title="Share invite code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          )}

          {/* Manage Trainees */}
          {isMentor && (
            <button
              onClick={() => setShowManageTrainees(true)}
              className="btn-primary"
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Manage Learners
            </button>
          )}
        </div>
      </header>

      {/* ── Two-panel body ── */}
      <div ref={bodyRef} style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Left: Topic tree panel */}
        <aside
          style={{
            width: `${treePanelWidth}px`,
            minWidth: "260px",
            background: "var(--color-bg-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {isLoadingTree ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: "0.75rem",
                flexDirection: "column",
              }}
            >
              <span
                className="spinner"
                style={{ borderTopColor: "var(--color-primary)", width: "2rem", height: "2rem" }}
              />
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 }}>
                Loading topics…
              </p>
            </div>
          ) : (
            <TopicTree
              spaceId={spaceId!}
              roots={roots}
              selectedNodeId={selectedNode?.node_id ?? null}
              onSelectNode={setSelectedNode}
              onCreate={createNode}
              onRename={(nodeId, payload) => renameNode(nodeId, payload)}
              onMove={reparentNode}
              onReorder={reorderNodes}
              onArchive={archiveNode}
              isMentor={isMentor}
              onMoveModeChange={setIsMoveMode}
            />
          )}
        </aside>

        {/* Resize handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize topic outline panel"
          onMouseDown={startTreeResize}
          className="panel-resize-handle"
          title="Drag to resize"
        />

        {/* Right: Node detail panel */}
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {isMoveMode && <div style={moveBlurOverlay} aria-hidden />}
          <NodeDetailPanel
            node={selectedNode}
            spaceId={spaceId ?? ""}
            onRename={handleNodeRename}
            onUpdateInstruction={handleUpdateInstruction}
            onNavigateToNode={handleNavigateToNode}
            isMentor={isMentor}
            studyState={selectedNode ? getNodeStudyState(selectedNode.node_id) : undefined}
            onStudyStateChange={selectedNode ? handleStudyStateChange : undefined}
          />
        </main>
      </div>

      {/* ── Invite code modal ── */}
      {showInviteModal && space.invite_code && (
        <InviteCodeModal
          inviteCode={space.invite_code}
          spaceName={space.space_name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ── Manage Trainees modal ── */}
      {showManageTrainees && (
        <ManageTraineesModal
          spaceId={space.space_id}
          onClose={() => setShowManageTrainees(false)}
        />
      )}
    </div>
  );
};

export default SpaceDetailPage;
