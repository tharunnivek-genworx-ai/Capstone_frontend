// src/features/spaces/components/NodeDetailPanel.tsx
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import type {
  EffectiveInstructionPart,
  NodeTreeNode,
  NodeUpdateInstructionRequest,
  TopicContentPage,
} from "../types/node.types";
import {
  useStudyMaterial,
  type NodeStudyStatePatch,
} from "../../study_material/hooks/useStudyMaterial";
import { useQuiz } from "../../quiz/hooks/useQuiz";
import type {
  ReferenceMaterialOut,
  StudyMaterialVersionOut,
} from "../../study_material/types/studyMaterial.types";
import StudyMaterialViewer from "../../study_material/components/StudyMaterialViewer";
import StudyMaterialFeedbackModal from "../../study_material/components/StudyMaterialFeedbackModal";
import StudyMaterialVersionPanel from "../../study_material/components/StudyMaterialVersionPanel";
import StudyMaterialManualEditor from "../../study_material/components/StudyMaterialManualEditor";
import TopicPageNav from "./TopicPageNav";
import ReferenceMaterialModal from "../../study_material/components/ReferenceMaterialModal";
import DeleteDraftConfirmModal from "../../study_material/components/DeleteDraftConfirmModal";
import RegenerateStudyMaterialConfirmModal from "../../study_material/components/RegenerateStudyMaterialConfirmModal";
import StudyMaterialPublishConfirmModal from "../../study_material/components/StudyMaterialPublishConfirmModal";
import StudyMaterialUnpublishConfirmModal from "../../study_material/components/StudyMaterialUnpublishConfirmModal";
import EspaceNotPublishedModal from "../../study_material/components/EspaceNotPublishedModal";
import TraineeStudyMaterialPanel from "../../study_material/components/TraineeStudyMaterialPanel";
import QuizPage3 from "../../quiz/components/QuizPage3";
import QuizPage4 from "../../quiz/components/QuizPage4";

// Re-export for consumers that import from here
export type { NodeStudyStatePatch };

function nonempty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t || null;
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
  spaceId: string;
  spaceIsPublished?: boolean;
  onRename: (nodeId: string, newTitle: string) => Promise<void>;
  onUpdateInstruction: (nodeId: string, payload: NodeUpdateInstructionRequest) => Promise<void>;
  onNavigateToNode: (nodeId: string) => void;
  isMentor?: boolean;
  studyState?: {
    currentPage: TopicContentPage;
    hasTriggeredGeneration: boolean;
    studyMaterialContent: string | null;
    activeVersion: StudyMaterialVersionOut | null;
    isGenerating: boolean;
    referenceMaterial: ReferenceMaterialOut | null;
    currentQuizId: string | null;
  };
  onStudyStateChange?: (patch: NodeStudyStatePatch) => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  spaceId,
  spaceIsPublished,
  onRename,
  onUpdateInstruction,
  onNavigateToNode,
  isMentor = true,
  studyState,
  onStudyStateChange,
}) => {
  // ── Instruction editing state (stays local — not study material) ─────────
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenameSaving, setIsRenameSaving] = useState(false);
  const [mode, setMode] = useState<InstructionMode>("inherit");
  const [modeText, setModeText] = useState("");
  const [branchDefault, setBranchDefault] = useState("");
  const [showBranchPanel, setShowBranchPanel] = useState(false);
  const [isSavingInstruction, setIsSavingInstruction] = useState(false);
  const [showSavedConfirm, setShowSavedConfirm] = useState(false);

  // ── Study material hook ─────────────────────────────────────────────────
  const sm = useStudyMaterial({
    node,
    spaceId,
    spaceIsPublished,
    isMentor,
    studyState,
    onStudyStateChange,
  });

  // ── Quiz hook ─────────────────────────────────────────────────────────────
  const qz = useQuiz({
    node,
    isMentor,
    spaceIsPublished,
    currentPage: sm.currentPage,
    canAccessQuiz: sm.canAccessQuiz,
    currentQuizId: studyState?.currentQuizId ?? null,
    onQuizIdChange: (quizId) => onStudyStateChange?.({ currentQuizId: quizId }),
    onPageChange: sm.setCurrentPage,
  });

  // ── Sync local instruction UI when node changes ─────────────────────────
  useEffect(() => {
    if (node) {
      setRenameValue(node.title);
      setIsRenaming(false);
      const detected = detectMode(node);
      setMode(detected);
      if (detected === "replace") setModeText(node.node_specific_instruction ?? "");
      else if (detected === "extend") setModeText(node.node_additive_instruction ?? "");
      else setModeText("");
      setBranchDefault(node.tree_default_instruction ?? "");
    }
  }, [node?.node_id]);

  const previewParts = node?.effective_instruction_parts ?? [];

  const getPreviewBorderColor = (part: EffectiveInstructionPart): string =>
    part.type === "extra" || part.type === "override"
      ? "var(--color-success)"
      : "var(--color-primary)";

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
        instruction_mode: mode,
        instruction_text: mode === "inherit" ? null : (modeText.trim() || null),
        branch_default_instruction: branchDefault.trim() || null,
      };
      await onUpdateInstruction(node!.node_id, payload);
      setShowSavedConfirm(true);
      setTimeout(() => setShowSavedConfirm(false), 2000);
      toast.success("Teaching settings saved.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Save failed.");
    } finally {
      setIsSavingInstruction(false);
    }
  };

  const handleModeChange = useCallback(
    (m: InstructionMode) => {
      if (!node) return;
      setMode(m);
      if (m === "replace") setModeText(node.node_specific_instruction ?? "");
      else if (m === "extend") setModeText(node.node_additive_instruction ?? "");
      else setModeText("");
    },
    [node]
  );

  // ── Instruction change banner JSX ───────────────────────────────────────
  const instructionChangeBanner = sm.showInstructionChangeBanner ? (
    <div className="study-material-instruction-change-banner">
      <span>
        This topic&apos;s effective instruction has changed (for example after moving it in the tree).
        You can generate new material with the updated instruction set, or keep your existing drafts.
      </span>
      <div className="study-material-instruction-change-banner__actions">
        <button
          type="button"
          className="study-material-instruction-change-banner__btn"
          onClick={sm.handleUseNewInstructions}
        >
          Use new instructions
        </button>
        <button
          type="button"
          className="study-material-instruction-change-banner__btn"
          onClick={sm.handleKeepExistingDraftsAfterMove}
        >
          Keep existing drafts
        </button>
      </div>
    </div>
  ) : null;

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!node) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "2rem", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--color-bg-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-secondary)", margin: "0 0 0.375rem" }}>
          Select a topic from your outline to view and edit it
        </p>
      </div>
    );
  }

  const childCount = node.children.length;
  const metadataParts = [getDepthLabel(node.level)];
  if (childCount > 0) metadataParts.push(`${childCount} subtopic${childCount === 1 ? "" : "s"}`);

  return (
    <div
      className="animate-fade-in"
      style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg-surface)", minHeight: 0 }}
    >
      {/* ── Header row (title + branch toggle + pagination) ─────────────── */}
      <div className="node-detail-panel__header" style={{ flexShrink: 0, padding: "1.5rem 1.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
          {/* Left: title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {node.auto_generated && (
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", background: "var(--color-primary-subtle)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>Auto-generated</span>
              </div>
            )}
            {isRenaming ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input autoFocus className="input-field" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") { setIsRenaming(false); setRenameValue(node.title); } }}
                  style={{ fontSize: "1rem", fontWeight: 600 }} maxLength={300} />
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
                    <button onClick={() => setIsRenaming(true)} title="Rename this topic"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.125rem", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                  )}
                </div>
                <p style={{ margin: "0.375rem 0 0", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  {metadataParts.join(" · ")}
                </p>
                {isMentor && sm.currentPage === 1 && (
                  <div className="node-detail-branch" style={{ marginTop: "0.75rem", maxWidth: "min(360px, 100%)" }}>
                    <button type="button" id="branch-default-toggle" onClick={() => setShowBranchPanel((v) => !v)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--color-bg-surface)", border: `1px solid ${branchDefault.trim() ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: "var(--radius-lg)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", boxShadow: "var(--shadow-subtle)" }}>
                      <span style={{ textAlign: "left", lineHeight: 1.3 }}>
                        Instruction for This Topic Branch{branchDefault.trim() ? " ●" : ""}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showBranchPanel ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {showBranchPanel && (
                      <div className="node-detail-branch__panel">
                        <textarea id="branch-default-instruction" className="input-field"
                          placeholder="Default instruction for all subtopics in this branch…"
                          value={branchDefault} onChange={(e) => setBranchDefault(e.target.value)}
                          rows={4} style={{ resize: "vertical", minHeight: "88px", fontSize: "0.8125rem" }} />
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.4, flex: 1, minWidth: "140px" }}>
                            Applies to subtopics in this branch. Topic-only prompts are never inherited.
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                            {showSavedConfirm && (
                              <span className="save-confirm-fade" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-success)" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                Saved
                              </span>
                            )}
                            <button
                              type="button"
                              id="save-branch-instruction-btn"
                              onClick={handleSaveInstruction}
                              className="btn-primary"
                              style={{ height: "32px", padding: "0 0.75rem", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                              disabled={isSavingInstruction}
                            >
                              {isSavingInstruction ? <><span className="spinner" />Saving…</> : "Save Instructions"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: pagination */}
          {isMentor && !isRenaming && (() => {
            // ── Compute accurate tab tooltips from backend state ─────────────
            // Quiz tab: three distinct locked states
            let quizDisabledTooltip: string;
            if (!sm.mentorUiState?.has_versions) {
              quizDisabledTooltip = "Generate study material first";
            } else if (spaceIsPublished === false) {
              quizDisabledTooltip = "Publish the space to access Quiz";
            } else if (!sm.mentorUiState?.published_version_id) {
              quizDisabledTooltip = "Publish study material to access Quiz";
            } else {
              quizDisabledTooltip = "Generate study material first";
            }

            // Hints tab: locked until a quiz exists, or if version is stale
            let hintsDisabledTooltip: string;
            if (qz.isStaleVersion) {
              hintsDisabledTooltip = "Study material was updated — generate a new quiz first";
            } else if (!qz.canAccessHints && qz.quizDraftExists) {
              hintsDisabledTooltip = "Quiz must be in an accessible state to view Hints";
            } else {
              hintsDisabledTooltip = "Generate a quiz first";
            }

            return (
              <div style={{ flexShrink: 0 }}>
                <TopicPageNav
                  currentPage={sm.currentPage}
                  canAccessStudyMaterial={sm.canAccessStudyMaterial}
                  canAccessQuiz={sm.canAccessQuiz}
                  canAccessHints={sm.canAccessQuiz && qz.canAccessHints}
                  onPageChange={sm.setCurrentPage}
                  quizDisabledTooltip={quizDisabledTooltip}
                  hintsDisabledTooltip={hintsDisabledTooltip}
                />
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <div className="node-detail-panel__body" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "0 1.5rem 1.5rem", overflow: "hidden" }}>

        {/* Trainee — published study material */}
        {!isMentor && node && (
          <TraineeStudyMaterialPanel nodeId={node.node_id} nodeTitle={node.title} />
        )}

        {/* Mentor pages */}
        {isMentor && (
          <>
        {/* PAGE 1 — Teaching settings */}
        {sm.currentPage === 1 && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", flex: 1, minHeight: 0, overflowY: "auto" }}>
            {instructionChangeBanner}
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 0.375rem" }}>
              How should AI teach this topic?
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.5 }}>
              Control how the AI will approach this topic when generating study material.
            </p>

            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.75rem" }}>
              {(["inherit", "extend", "replace"] as InstructionMode[]).map((m) => (
                <button key={m} id={`instruction-mode-${m}`} onClick={() => handleModeChange(m)}
                  style={mode === m ? modeButtonActive : modeButtonBase}>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 0.5rem", lineHeight: 1.5 }}>
              {MODE_DESCRIPTIONS[mode]}
            </p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic", margin: "0 0 0.875rem", lineHeight: 1.5 }}>
              {MODE_HINTS[mode]}
            </p>

            <div className={`instruction-editor-collapse ${mode !== "inherit" ? "instruction-editor-collapse--visible" : "instruction-editor-collapse--hidden"}`} style={{ marginBottom: "1rem" }}>
              <label htmlFor="instruction-text" className="label">
                {mode === "extend" ? "Prompt for this topic" : "Your custom instructions for this topic"}
              </label>
              <textarea id="instruction-text" className="input-field instruction-textarea"
                placeholder={mode === "extend" ? "e.g. Include one short code snippet. Keep it practical." : "e.g. Explain this only for experienced Python developers. Skip beginner context."}
                value={modeText} onChange={(e) => setModeText(e.target.value)} rows={4} />
            </div>

            {/* AI Instruction Preview header row */}
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    AI Instruction Preview
                  </span>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: "0.25rem 0 0", lineHeight: 1.4 }}>
                    This is exactly how AI will be guided when generating content for this topic.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {showSavedConfirm && (
                    <span className="save-confirm-fade" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-success)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Saved
                    </span>
                  )}
                  <button id="save-instruction-btn" onClick={handleSaveInstruction} className="btn-primary"
                    style={{ height: "36px", minWidth: "160px", padding: "0 0.875rem", whiteSpace: "nowrap" }}
                    disabled={isSavingInstruction}>
                    {isSavingInstruction ? <><span className="spinner" />Saving…</> : "Save Teaching Settings"}
                  </button>
                </div>
              </div>

              {/* Preview box */}
              <div style={{ background: "var(--color-bg-surface-alt)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "0.75rem", minHeight: "56px" }}>
                {previewParts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {previewParts.map((part, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                          {part.type === "inherited" ? (
                            <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onNavigateToNode(part.source_node_id)} title={`Go to: ${part.source_node_title}`}>
                              {part.label}
                            </span>
                          ) : part.label}
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

              {/* Reference material + Generate row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.875rem", gap: "0.75rem", flexWrap: "wrap" }}>
                {/* Reference material button */}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => sm.setShowRefModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    padding: "0 0.875rem",
                    height: "36px",
                    borderColor: sm.referenceMaterial ? "var(--color-success)" : "var(--color-border)",
                    color: sm.referenceMaterial ? "var(--color-success)" : "var(--color-text-secondary)",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    {sm.referenceMaterial
                      ? <polyline points="20 6 9 17 4 12" />
                      : <line x1="12" y1="9" x2="12" y2="15" />
                    }
                    {!sm.referenceMaterial && <line x1="9" y1="12" x2="15" y2="12" />}
                  </svg>
                  {sm.referenceMaterial ? sm.referenceMaterial.title : "Add Reference Material"}
                </button>

                {sm.hasTriggeredGeneration ? (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => sm.setCurrentPage(2)}
                      style={{ fontWeight: 600, borderColor: "var(--color-primary)", color: "var(--color-primary)", minWidth: "190px", height: "36px" }}
                    >
                      Open Study Material →
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => sm.setShowRegenerateConfirmModal(true)}
                      disabled={!sm.canClearAllDrafts || sm.isGenerating || sm.isDeletingDrafts}
                      title={
                        sm.canClearAllDrafts
                          ? "Delete all drafts and generate fresh study material"
                          : sm.clearDraftsBlockReason
                      }
                      style={{
                        fontWeight: 600,
                        borderColor: "var(--color-primary)",
                        color: "var(--color-primary)",
                        minWidth: "190px",
                        height: "36px",
                      }}
                    >
                      {sm.isDeletingDrafts || sm.isGenerating ? "Working…" : "Regenerate Study Materials"}
                    </button>
                  </div>
                ) : (
                  <button
                    id="generate-study-material-btn"
                    type="button"
                    className="btn-secondary"
                    onClick={sm.handleGenerateStudyMaterial}
                    disabled={sm.isGenerating}
                    style={{ fontWeight: 600, borderColor: "var(--color-primary)", color: "var(--color-primary)", minWidth: "190px", height: "36px" }}
                  >
                    {sm.isGenerating ? "Generating…" : "Generate Study Materials"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2 — Study material */}
        {sm.currentPage === 2 && (
          <div className="study-material-page">
            {instructionChangeBanner}
            {sm.isGenerating ? (
              <div className="study-material-loading">
                <span className="spinner study-material-loading__spinner" />
                <p className="study-material-loading__title">
                  {sm.processingLabel ?? "Working on study material"}
                </p>
                <p className="study-material-loading__subtitle">
                  The AI is updating study content for &ldquo;{node.title}&rdquo;. This may take a minute.
                </p>
              </div>
            ) : sm.studyMaterialContent ? (
              <>
                {isMentor && !sm.isManualEditMode && (
                  <div className="study-material-page__toolbar">
                    <div className="study-material-page__actions">
                      <button
                        type="button"
                        className="btn-secondary study-material-page__action-btn"
                        onClick={() => sm.setFeedbackModalMode("regenerate")}
                        disabled={!sm.canEditActiveDraft}
                        title={
                          sm.canEditActiveDraft
                            ? undefined
                            : sm.isViewingNonActiveVersion
                              ? "Return to the active draft to regenerate"
                              : "Set this version as your working draft to regenerate it"
                        }
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        className="btn-secondary study-material-page__action-btn"
                        onClick={() => sm.setFeedbackModalMode("improve")}
                        disabled={!sm.canEditActiveDraft}
                        title={
                          sm.canEditActiveDraft ? undefined : "Return to the active draft to improve it"
                        }
                      >
                        Improve
                      </button>
                      <button
                        type="button"
                        className="btn-secondary study-material-page__action-btn"
                        onClick={() => sm.setIsManualEditMode(true)}
                        disabled={!sm.canEditActiveDraft}
                        title={
                          sm.canEditActiveDraft ? undefined : "Return to the active draft to edit it"
                        }
                      >
                        Manual edit
                      </button>
                      <button
                        type="button"
                        className={`btn-secondary study-material-page__action-btn study-material-page__archive-toggle${
                          sm.showArchivedPanel ? " study-material-page__archive-toggle--active" : ""
                        }`}
                        onClick={() => sm.setShowArchivedPanel((v) => !v)}
                        title="View archived drafts"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="21 8 21 21 3 21 3 8" />
                          <rect x="1" y="3" width="22" height="5" />
                          <line x1="10" y1="12" x2="14" y2="12" />
                        </svg>
                        Archived
                        {sm.archivedVersionHistory.length > 0 && (
                          <span className="study-material-page__archive-count">
                            {sm.archivedVersionHistory.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary study-material-page__action-btn study-material-page__delete-draft-btn"
                        onClick={() => sm.setShowDeleteDraftModal(true)}
                        disabled={!sm.canClearAllDrafts || sm.isDeletingDrafts}
                        title={
                          sm.canClearAllDrafts
                            ? "Remove all drafts and start fresh on the teaching page"
                            : sm.clearDraftsBlockReason
                        }
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                        Delete draft
                      </button>
                    </div>
                    {sm.isViewingArchivedVersion && (
                      <div className="study-material-page__viewing-notice">
                        <div className="study-material-page__viewing-banner study-material-page__viewing-banner--archived">
                          <span>Viewing an archived draft — not in your working history.</span>
                        </div>
                        {sm.displayedVersionId && (
                          <button
                            type="button"
                            className="btn-primary study-material-page__activate-btn"
                            onClick={sm.handleUnarchiveCurrentVersion}
                            disabled={sm.isUnarchivingVersion}
                          >
                            {sm.isUnarchivingVersion ? "Restoring…" : "Unarchive"}
                          </button>
                        )}
                      </div>
                    )}
                    {!sm.isViewingArchivedVersion && sm.isViewingNonActiveVersion && (
                      <div className="study-material-page__viewing-notice">
                        <div className="study-material-page__viewing-banner">
                          <span>
                            This is not the active draft you are working on. Want to set it?
                          </span>
                          <button
                            type="button"
                            className="study-material-page__banner-link"
                            onClick={sm.handleReturnToActiveDraft}
                          >
                            Back to active draft
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn-primary study-material-page__activate-btn"
                          onClick={() => sm.handleActivateVersion(sm.viewingVersionId!)}
                          disabled={sm.isActivatingVersion}
                        >
                          {sm.isActivatingVersion ? "Setting…" : "Set as active draft"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="study-material-page__workspace">
                  <div className="study-material-page__main">
                    {isMentor && sm.isManualEditMode ? (
                      <StudyMaterialManualEditor
                        initialContent={sm.studyMaterialContent}
                        title={node.title}
                        versionLabel={sm.activeVersion?.display_label ?? null}
                        isSaving={sm.isSavingManualEdit}
                        onCancel={() => sm.setIsManualEditMode(false)}
                        onSave={sm.handleManualEditSave}
                      />
                    ) : (
                      <StudyMaterialViewer
                        nodeId={node.node_id}
                        content={sm.studyMaterialContent}
                        title={node.title}
                        versionLabel={sm.displayedVersionSummary?.display_label ?? sm.activeVersion?.display_label ?? null}
                        referenceMaterialId={
                          sm.activeVersion?.reference_material_id ??
                          sm.referenceMaterial?.material_id ??
                          null
                        }
                        referenceImagesRefreshKey={
                          sm.viewingVersionId ?? sm.activeVersion?.version_id ?? sm.studyMaterialContent
                        }
                        canArchive={sm.canArchiveDisplayedVersion}
                        isArchiving={sm.isArchivingVersion}
                        onArchive={sm.handleArchiveCurrentVersion}
                        lineageChain={sm.displayedVersionSummary?.lineage_chain ?? []}
                        onSelectLineageVersion={sm.handleSelectVersion}
                        canPublish={sm.canPublishDisplayedVersion}
                        canUnpublish={sm.canUnpublishDisplayedVersion}
                        publishButtonLabel={sm.publishButtonLabel}
                        publishDisabledTooltip={sm.publishDisabledTooltip}
                        unpublishDisabledTooltip={sm.unpublishDisabledTooltip}
                        isPublishing={sm.isPublishingVersion}
                        isUnpublishing={sm.isUnpublishingVersion}
                        onPublish={sm.handlePublishCurrentVersion}
                        onUnpublish={sm.handleUnpublishCurrentVersion}
                      />
                    )}
                  </div>

                  {isMentor && !sm.isManualEditMode && (
                    <StudyMaterialVersionPanel
                      versions={sm.showArchivedPanel ? sm.archivedVersionHistory : sm.versionHistory}
                      activeVersionId={sm.mentorUiState?.active_version_id ?? sm.activeVersion?.version_id ?? null}
                      viewingVersionId={sm.viewingVersionId}
                      isLoading={sm.isLoadingVersions}
                      isUnarchiving={sm.isUnarchivingVersion}
                      mode={sm.showArchivedPanel ? "archived" : "active"}
                      onSelectVersion={sm.handleSelectVersion}
                      onUnarchiveVersion={sm.handleUnarchiveVersion}
                      onBackToActiveHistory={() => sm.setShowArchivedPanel(false)}
                    >
                      {/* Proceed to Quiz Generation button — above version history */}
                      <div style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--color-border)", marginBottom: "0.5rem" }}>
                        <button
                          type="button"
                          disabled={!sm.canAccessQuiz}
                          title={!sm.canAccessQuiz ? "Publish study material to enable quiz generation" : undefined}
                          onClick={() => {
                            if (sm.canAccessQuiz) {
                              sm.setCurrentPage(3);
                            }
                          }}
                          style={{
                            width: "100%", padding: "0.5rem 0.875rem",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${!sm.canAccessQuiz ? "var(--color-border)" : qz.quizDraftExists ? "var(--color-border)" : "var(--color-primary)"}`,
                            background: !sm.canAccessQuiz ? "transparent" : qz.quizDraftExists ? "var(--color-bg-surface-alt)" : "var(--color-primary-subtle)",
                            color: !sm.canAccessQuiz ? "var(--color-text-muted)" : qz.quizDraftExists ? "var(--color-text-secondary)" : "var(--color-primary)",
                            cursor: !sm.canAccessQuiz ? "not-allowed" : "pointer", 
                            fontSize: "0.8125rem", fontWeight: 600,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                            transition: "all 0.15s",
                            opacity: !sm.canAccessQuiz ? 0.5 : 1,
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {qz.quizDraftExists ? (
                              <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" /></>
                            ) : (
                              <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>
                            )}
                          </svg>
                          {qz.quizDraftExists ? "View Quiz Draft" : "Proceed to Quiz Generation"}
                        </button>
                      </div>
                    </StudyMaterialVersionPanel>
                  )}
                </div>
              </>
            ) : (
              <div className="study-material-loading">
                <p className="study-material-loading__title">No study material yet</p>
                <p className="study-material-loading__subtitle">
                  Go back to page 1 and click Generate Study Materials to create content for this topic.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PAGE 3 — Quiz */}
        {sm.currentPage === 3 && (
          <QuizPage3
            nodeTitle={node.title}
            qz={qz}
          />
        )}

        {/* PAGE 4 — Hints */}
        {sm.currentPage === 4 && (
          <QuizPage4
            qz={qz}
            onPageChange={sm.setCurrentPage}
          />
        )}
          </>
        )}
      </div>

      {isMentor && sm.feedbackModalMode && (
        <StudyMaterialFeedbackModal
          mode={sm.feedbackModalMode}
          nodeTitle={node.title}
          versionLabel={sm.activeVersion?.display_label ?? null}
          isSubmitting={sm.isGenerating}
          onClose={() => !sm.isGenerating && sm.setFeedbackModalMode(null)}
          onSubmit={(feedback) => sm.runFeedbackAction(sm.feedbackModalMode!, feedback)}
        />
      )}

      {isMentor && sm.publishPreview && (
        <StudyMaterialPublishConfirmModal
          preview={sm.publishPreview}
          onClose={sm.closePublishModal}
          onConfirm={() => void sm.confirmPublish()}
          isSubmitting={sm.isPublishingVersion}
          transactionError={sm.publishTransactionError}
        />
      )}

      {isMentor && sm.unpublishPreview && (
        <StudyMaterialUnpublishConfirmModal
          preview={sm.unpublishPreview}
          onClose={sm.closeUnpublishModal}
          onConfirm={() => void sm.confirmUnpublish()}
          isSubmitting={sm.isUnpublishingVersion}
          transactionError={sm.unpublishTransactionError}
        />
      )}

      {isMentor && sm.showEspaceNotPublishedModal && (
        <EspaceNotPublishedModal onClose={() => sm.setShowEspaceNotPublishedModal(false)} />
      )}

      {isMentor && sm.showRegenerateConfirmModal && (
        <RegenerateStudyMaterialConfirmModal
          nodeTitle={node.title}
          hasReferenceMaterial={Boolean(sm.referenceMaterial)}
          onClose={() => !sm.isDeletingDrafts && !sm.isGenerating && sm.setShowRegenerateConfirmModal(false)}
          onConfirm={() => void sm.handleRegenerateStudyMaterialFresh()}
          isSubmitting={sm.isDeletingDrafts || sm.isGenerating}
        />
      )}

      {isMentor && sm.showDeleteDraftModal && sm.clearDraftsEligibility && (
        <DeleteDraftConfirmModal
          nodeTitle={node.title}
          versionCount={sm.clearDraftsEligibility.version_count}
          onClose={() => !sm.isDeletingDrafts && sm.setShowDeleteDraftModal(false)}
          onConfirm={() => void sm.handleClearAllDrafts()}
          isSubmitting={sm.isDeletingDrafts}
        />
      )}

      {/* Reference material modal */}
      {isMentor && sm.showRefModal && (
        <ReferenceMaterialModal
          spaceId={spaceId}
          nodeId={node.node_id}
          nodeTitle={node.title}
          existing={sm.referenceMaterial}
          onClose={() => sm.setShowRefModal(false)}
          onUploaded={(mat) => {
            sm.setReferenceMaterial(mat);
            sm.setShowRefModal(false);
          }}
          onDeleted={() => {
            sm.setReferenceMaterial(null);
            sm.setShowRefModal(false);
          }}
        />
      )}
    </div>
  );
};

export default NodeDetailPanel;
