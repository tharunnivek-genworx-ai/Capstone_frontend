// src/features/spaces/components/NodeDetailPanel.tsx
/**
 * Right panel showing selected node details and teaching instructions.
 */

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode, NodeUpdateInstructionRequest } from "../types/node.types";

function nonempty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t || null;
}

function getAncestors(roots: NodeTreeNode[], nodeId: string): NodeTreeNode[] {
  function walk(nodes: NodeTreeNode[], target: string, trail: NodeTreeNode[]): NodeTreeNode[] | null {
    for (const n of nodes) {
      if (n.node_id === target) return trail;
      const found = walk(n.children, target, [...trail, n]);
      if (found) return found;
    }
    return null;
  }
  return walk(roots, nodeId, []) ?? [];
}

type InstructionMode = "inherit" | "extend" | "replace";

function detectMode(node: NodeTreeNode): InstructionMode {
  if (nonempty(node.node_specific_instruction)) return "replace";
  if (nonempty(node.node_additive_instruction)) return "extend";
  return "inherit";
}

function getDepthLabel(level: number): string {
  if (level === 1) return "Top-Level Section";
  if (level === 2) return "Subtopic";
  return "Nested Topic";
}

const MODE_LABELS: Record<InstructionMode, string> = {
  inherit: "Use Parent's Settings",
  extend: "Prompt for This Topic",
  replace: "Set My Own Instructions",
};

const MODE_DESCRIPTIONS: Record<InstructionMode, string> = {
  inherit: "AI will use the instructions set by the parent section. Nothing extra is saved for this topic.",
  extend: "Add a prompt that applies only when generating study material for this topic. It is not passed to subtopics.",
  replace: "AI ignores the parent section's instructions entirely and uses only what you write below.",
};

const MODE_HINTS: Record<InstructionMode, string> = {
  inherit: "Currently using the parent section's instructions — no custom text saved for this topic.",
  extend: "This prompt affects only this topic. You can still set a branch instruction for future subtopics separately.",
  replace: "Using only what you write below — parent instructions are ignored for this topic.",
};

const modeButtonBase: React.CSSProperties = {
  flex: 1,
  padding: "0.5rem 0.625rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  transition: "all 0.15s",
  background: "var(--color-bg-surface)",
  color: "var(--color-text-secondary)",
};

const modeButtonActive: React.CSSProperties = {
  ...modeButtonBase,
  background: "var(--color-primary)",
  color: "#fff",
  borderColor: "var(--color-primary)",
};

interface NodeDetailPanelProps {
  node: NodeTreeNode | null;
  roots: NodeTreeNode[];
  onRename: (nodeId: string, newTitle: string) => Promise<void>;
  onUpdateInstruction: (nodeId: string, payload: NodeUpdateInstructionRequest) => Promise<void>;
  onNavigateToNode: (nodeId: string) => void;
  isMentor?: boolean;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  roots,
  onRename,
  onUpdateInstruction,
  onNavigateToNode,
  isMentor = true,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenameSaving, setIsRenameSaving] = useState(false);

  const [mode, setMode] = useState<InstructionMode>("inherit");
  const [modeText, setModeText] = useState("");
  const [branchDefault, setBranchDefault] = useState("");
  const [showBranchPanel, setShowBranchPanel] = useState(false);
  const [isSavingInstruction, setIsSavingInstruction] = useState(false);
  const [showSavedConfirm, setShowSavedConfirm] = useState(false);

  useEffect(() => {
    if (node) {
      setRenameValue(node.title);
      setIsRenaming(false);
      const detected = detectMode(node);
      setMode(detected);
      if (detected === "replace") {
        setModeText(node.node_specific_instruction ?? "");
      } else if (detected === "extend") {
        setModeText(node.node_additive_instruction ?? "");
      } else {
        setModeText("");
      }
      setBranchDefault(node.tree_default_instruction ?? "");
    }
  }, [node?.node_id]);

  const ancestors = node ? getAncestors(roots, node.node_id) : [];

  type PreviewPart = {
    sourceNodeId: string;
    sourceNodeTitle: string;
    text: string;
    type: "inherited" | "branch-default" | "extra" | "override";
  };

  const previewParts: PreviewPart[] = [];

  if (node) {
    if (mode === "replace") {
      const text = modeText.trim();
      if (text) {
        previewParts.push({
          sourceNodeId: node.node_id,
          sourceNodeTitle: node.title,
          text,
          type: "override",
        });
      }
    } else {
      for (const a of ancestors) {
        const v = nonempty(a.tree_default_instruction);
        if (v) {
          previewParts.push({
            sourceNodeId: a.node_id,
            sourceNodeTitle: a.title,
            text: v,
            type: "inherited",
          });
        }
      }
      const tdi = nonempty(branchDefault.trim());
      if (tdi) {
        previewParts.push({
          sourceNodeId: node.node_id,
          sourceNodeTitle: node.title,
          text: tdi,
          type: "branch-default",
        });
      }
      if (mode === "extend") {
        const nai = nonempty(modeText.trim());
        if (nai) {
          previewParts.push({
            sourceNodeId: node.node_id,
            sourceNodeTitle: node.title,
            text: nai,
            type: "extra",
          });
        }
      }
    }
  }

  const getPreviewLabel = (part: PreviewPart): string => {
    switch (part.type) {
      case "inherited":
        return `From parent section (${part.sourceNodeTitle}):`;
      case "branch-default":
        return "Instruction for This Topic Branch:";
      case "extra":
        return "Prompt for this topic:";
      case "override":
        return "Your custom instruction:";
    }
  };

  const getPreviewBorderColor = (part: PreviewPart): string => {
    if (part.type === "extra" || part.type === "override") return "var(--color-success)";
    return "var(--color-primary)";
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || renameValue.trim() === node!.title) {
      setIsRenaming(false);
      return;
    }
    setIsRenameSaving(true);
    try {
      await onRename(node!.node_id, renameValue.trim());
      toast.success("Topic renamed!");
      setIsRenaming(false);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Rename failed.");
    } finally {
      setIsRenameSaving(false);
    }
  };

  const handleSaveInstruction = async () => {
    setIsSavingInstruction(true);
    try {
      const payload: NodeUpdateInstructionRequest = {
        node_specific_instruction: mode === "replace" ? (modeText.trim() || null) : null,
        node_additive_instruction: mode === "extend" ? (modeText.trim() || null) : null,
        tree_default_instruction: branchDefault.trim() || null,
      };
      await onUpdateInstruction(node!.node_id, payload);
      setShowSavedConfirm(true);
      setTimeout(() => setShowSavedConfirm(false), 2000);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Save failed.");
    } finally {
      setIsSavingInstruction(false);
    }
  };

  const handleModeChange = useCallback((m: InstructionMode) => {
    if (!node) return;
    setMode(m);
    if (m === "replace") setModeText(node.node_specific_instruction ?? "");
    else if (m === "extend") setModeText(node.node_additive_instruction ?? "");
    else setModeText("");
  }, [node]);

  if (!node) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "2rem", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--color-bg-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-secondary)", margin: "0 0 0.375rem" }}>Select a topic from your outline to view and edit it</p>
      </div>
    );
  }

  const childCount = node.children.length;
  const metadataParts = [getDepthLabel(node.level)];
  if (childCount > 0) {
    metadataParts.push(`${childCount} subtopic${childCount === 1 ? "" : "s"}`);
  }

  return (
    <div className="animate-fade-in" style={{ height: "100%", overflowY: "auto", padding: "1.5rem", background: "var(--color-bg-surface)" }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {node.auto_generated && (
            <div style={{ marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", background: "var(--color-primary-subtle)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>Auto-generated</span>
            </div>
          )}

          {isRenaming ? (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input autoFocus className="input-field" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") { setIsRenaming(false); setRenameValue(node.title); } }} style={{ fontSize: "1rem", fontWeight: 600 }} maxLength={300} />
              <button onClick={handleRenameSubmit} className="btn-primary" style={{ padding: "0.5rem 0.875rem", flexShrink: 0 }} disabled={isRenameSaving}>
                {isRenameSaving ? <span className="spinner" /> : "Save"}
              </button>
              <button onClick={() => { setIsRenaming(false); setRenameValue(node.title); }} className="btn-secondary" style={{ padding: "0.5rem", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.3 }}>{node.title}</h2>
                {isMentor && (
                  <button
                    onClick={() => setIsRenaming(true)}
                    title="Rename this topic"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      padding: "0.125rem",
                      borderRadius: "var(--radius-sm)",
                      display: "inline-flex",
                      alignItems: "center",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                )}
              </div>
              <p style={{ margin: "0.375rem 0 0", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                {metadataParts.join(" · ")}
              </p>
            </>
          )}
        </div>

        {isMentor && !isRenaming && (
          <div style={{ flexShrink: 0, width: "min(280px, 100%)", position: "relative" }}>
            <button
              type="button"
              id="branch-default-toggle"
              onClick={() => setShowBranchPanel((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                background: "var(--color-bg-surface)",
                border: `1px solid ${branchDefault.trim() ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <span style={{ textAlign: "left", lineHeight: 1.3 }}>
                Instruction for This Topic Branch
                {branchDefault.trim() ? " ●" : ""}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showBranchPanel ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showBranchPanel && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.375rem)",
                  right: 0,
                  left: 0,
                  zIndex: 20,
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.75rem",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <textarea
                  id="branch-default-instruction"
                  className="input-field"
                  placeholder="Default instruction for all subtopics in this branch…"
                  value={branchDefault}
                  onChange={(e) => setBranchDefault(e.target.value)}
                  rows={4}
                  style={{ resize: "vertical", minHeight: "88px", fontSize: "0.8125rem" }}
                />
                <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: "0.375rem 0 0", lineHeight: 1.4 }}>
                  Applies to subtopics in this branch. Topic-only prompts are never inherited.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {isMentor && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 0.375rem" }}>
            How should AI teach this topic?
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.5 }}>
            Control how the AI will approach this topic when generating study material.
          </p>

          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.75rem" }}>
            {(["inherit", "extend", "replace"] as InstructionMode[]).map((m) => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  id={`instruction-mode-${m}`}
                  onClick={() => handleModeChange(m)}
                  style={isActive ? modeButtonActive : modeButtonBase}
                >
                  {MODE_LABELS[m]}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 0.5rem", lineHeight: 1.5 }}>
            {MODE_DESCRIPTIONS[mode]}
          </p>

          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic", margin: "0 0 0.875rem", lineHeight: 1.5 }}>
            {MODE_HINTS[mode]}
          </p>

          <div
            className={`instruction-editor-collapse ${mode !== "inherit" ? "instruction-editor-collapse--visible" : "instruction-editor-collapse--hidden"}`}
            style={{ marginBottom: "1rem" }}
          >
            <label htmlFor="instruction-text" className="label">
              {mode === "extend" ? "Prompt for this topic" : "Your custom instructions for this topic"}
            </label>
            <textarea
              id="instruction-text"
              className="input-field instruction-textarea"
              placeholder={
                mode === "extend"
                  ? "e.g. Include one short code snippet. Keep it practical."
                  : "e.g. Explain this only for experienced Python developers. Skip beginner context."
              }
              value={modeText}
              onChange={(e) => setModeText(e.target.value)}
              rows={4}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                AI Instruction Preview
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: "0 0 0.5rem", lineHeight: 1.4 }}>
              This is exactly how AI will be guided when generating content for this topic.
            </p>
            <div style={{ background: "var(--color-bg-surface-alt)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "0.75rem", minHeight: "56px" }}>
              {previewParts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {previewParts.map((part, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                        {part.type === "inherited" ? (
                          <span
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => onNavigateToNode(part.sourceNodeId)}
                            title={`Go to: ${part.sourceNodeTitle}`}
                          >
                            {getPreviewLabel(part)}
                          </span>
                        ) : (
                          getPreviewLabel(part)
                        )}
                      </div>
                      <pre style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", lineHeight: 1.6, borderLeft: `2px solid ${getPreviewBorderColor(part)}`, paddingLeft: "0.75rem" }}>
                        {part.text}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  No instructions set yet. AI will use its default teaching style.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
            {showSavedConfirm && (
              <span className="save-confirm-fade" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-success)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved
              </span>
            )}
            <button
              id="save-instruction-btn"
              onClick={handleSaveInstruction}
              className="btn-primary"
              style={{ height: "40px", minWidth: "180px", width: "100%", maxWidth: "100%" }}
              disabled={isSavingInstruction}
            >
              {isSavingInstruction ? (
                <><span className="spinner" />Saving…</>
              ) : (
                "Save Teaching Settings"
              )}
            </button>
          </div>
          <style>{`
            @media (min-width: 768px) {
              #save-instruction-btn {
                width: auto !important;
              }
            }
          `}</style>
        </div>
      )}

      <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
        <div style={{ background: "var(--color-bg-surface-alt)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
            Study material, quizzes, and learner progress will appear here in a future phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
