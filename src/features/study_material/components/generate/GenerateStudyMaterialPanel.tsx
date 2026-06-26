// GenerateStudyMaterialPanel.tsx
import { useCallback, useState } from "react";
import { BookOpen } from "lucide-react";
import "../../styles/generateStudyMaterial.css";
import type { NodeTreeNode, EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";
import type { InstructionMode } from "./TeachingLineSelector";
import SubtopicDefaultSection from "./SubtopicDefaultSection";
import TeachingLineSelector from "./TeachingLineSelector";
import InstructionContextPanel from "./InstructionContextPanel";
import InstructionPreviewAccordion from "./InstructionPreviewAccordion";
import GenerateActionBar from "./GenerateActionBar";

export interface GenerateStudyMaterialPanelProps {
  node: NodeTreeNode;

  // ── Instruction editing state (owned by NodeDetailPanel) ──────────────
  mode: InstructionMode;
  onModeChange: (m: InstructionMode) => void;
  modeText: string;
  onModeTextChange: (text: string) => void;
  branchDefault: string;
  onBranchDefaultChange: (val: string) => void;

  // ── Derived / computed ────────────────────────────────────────────────
  previewParts: EffectiveInstructionPart[];

  // ── Save / discard ────────────────────────────────────────────────────
  isSaving: boolean;
  showSavedConfirm: boolean;
  onSave: () => void;
  /** Resets local instruction state back to the last-saved node values. */
  onDiscard: () => void;

  // ── Navigation ────────────────────────────────────────────────────────
  onNavigateToNode: (nodeId: string) => void;

  // ── Study material generation state + handlers ────────────────────────
  sm: UseStudyMaterialReturn;

  // ── Modal openers ────────────────────────────────────────────────────
  onOpenRefModal: () => void;
  onOpenMediaModal: () => void;
}

export default function GenerateStudyMaterialPanel({
  node,
  mode,
  onModeChange,
  modeText,
  onModeTextChange,
  branchDefault,
  onBranchDefaultChange,
  previewParts,
  isSaving,
  showSavedConfirm,
  onSave,
  onDiscard,
  onNavigateToNode,
  sm,
  onOpenRefModal,
  onOpenMediaModal,
}: GenerateStudyMaterialPanelProps) {
  const [isTeachingStyleExpanded, setIsTeachingStyleExpanded] = useState(true);
  const [showNoInstructionWarning, setShowNoInstructionWarning] = useState(false);

  const handleOpenExisting = useCallback(() => sm.setCurrentPage(2), [sm]);
  const handleRegenerate = useCallback(
    () => sm.setShowRegenerateConfirmModal(true),
    [sm]
  );

  const handleLocalModeChange = useCallback(
    (m: InstructionMode) => {
      onModeChange(m);
      if (m === "extend" || m === "replace") {
        setIsTeachingStyleExpanded(true);
        setTimeout(() => {
          const textareaId = m === "extend" ? "gsm-extend-textarea" : "gsm-replace-textarea";
          document.getElementById(textareaId)?.focus();
        }, 180);
      }
    },
    [onModeChange]
  );

  const handleGenerateClick = useCallback(() => {
    const hasInherited = previewParts.some(
      (p) => p.type === "inherited" || p.type === "branch-default"
    );
    const hasLocal = (mode === "extend" || mode === "replace") && modeText.trim().length > 0;
    const hasBranchDefault = branchDefault.trim().length > 0;
    const hasAnyInstruction = hasInherited || hasLocal || hasBranchDefault;

    if (!hasAnyInstruction) {
      setShowNoInstructionWarning(true);
    } else {
      void sm.handleGenerateStudyMaterial();
    }
  }, [previewParts, mode, modeText, branchDefault, sm]);

  const handleContinueFromWarning = useCallback(() => {
    setShowNoInstructionWarning(false);
    void sm.handleGenerateStudyMaterial();
  }, [sm]);

  const handleAddInstructionFromWarning = useCallback(() => {
    setShowNoInstructionWarning(false);
    onModeChange("extend");
    setIsTeachingStyleExpanded(true);
    setTimeout(() => {
      document.getElementById("gsm-extend-textarea")?.focus();
    }, 180);
  }, [onModeChange]);

  // Instruction-change banner is shown whenever the node's effective
  // instruction has shifted (e.g. after a tree-move).
  const instructionChangeBanner = sm.showInstructionChangeBanner ? (
    <div className="study-material-instruction-change-banner">
      <span>
        This topic&apos;s effective instruction has changed (for example after
        moving it in the tree). You can generate new material with the updated
        instruction set, or keep your existing drafts.
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

  return (
    <div className="gsm-page">
      {/* Top-of-scroll instruction change banner */}
      {instructionChangeBanner}

      {/* ── Main card ─────────────────────────────────────────────────── */}
      <div className="gsm-card">

        {/* Card header: title + reference pill + topic resources */}
        <div className="gsm-card__head">
          <div className="gsm-card__head-left">
            <h3 className="gsm-card__title">Generate study material</h3>
            <p className="gsm-card__subtitle">
              AI will write a draft for this topic. You review and edit before
              learners see anything.
            </p>
          </div>

          <div className="gsm-card__head-right">
            {/* Reference PDF pill */}
            <button
              type="button"
              className="gsm-ref-pill"
              onClick={onOpenRefModal}
              title={
                sm.referenceMaterial
                  ? `Reference: ${sm.referenceMaterial.title}`
                  : "Add a reference PDF for the AI to use"
              }
            >
              {sm.referenceMaterial && (
                <span className="gsm-ref-pill__dot" aria-hidden="true" />
              )}
              <span>
                {sm.referenceMaterial
                  ? sm.referenceMaterial.title
                  : "Add reference PDF"}
              </span>
            </button>

            {/* Topic resources quiet link */}
            <button
              type="button"
              className="gsm-resources-link"
              onClick={onOpenMediaModal}
              title="Images, links and videos for learners — not used by the AI generator"
            >
              <BookOpen size={14} aria-hidden />
              <span>
                {sm.nodeMedia.length > 0
                  ? `Topic resources (${sm.nodeMedia.length})`
                  : "Topic resources"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Section 1: Subtopic default (above teaching line) ─────── */}
        <div className="gsm-subtopic">
          <SubtopicDefaultSection
            nodeName={node.title}
            hasChildren={node.children.length > 0}
            value={branchDefault}
            onChange={onBranchDefaultChange}
            onClear={() => onBranchDefaultChange("")}
            onSave={onSave}
            isSaving={isSaving}
            isDirty={
              branchDefault.trim() !== (node.tree_default_instruction ?? "").trim()
            }
            showSavedConfirm={showSavedConfirm}
          />
        </div>

        {/* ── Section 2 + 3: Teaching line + mode tray ──────────────── */}
        <TeachingLineSelector
          mode={mode}
          onChange={handleLocalModeChange}
          previewParts={previewParts}
          isExpanded={isTeachingStyleExpanded}
          onToggleExpanded={() => setIsTeachingStyleExpanded((v) => !v)}
        />

        {/* ── Section 4: Mode-specific context panel (hidden when collapsed) ─ */}
        {isTeachingStyleExpanded && (
          <InstructionContextPanel
            id="gsm-teaching-style-context"
            mode={mode}
            modeText={modeText}
            onChange={onModeTextChange}
            previewParts={previewParts}
            onNavigateToNode={onNavigateToNode}
          />
        )}

        {/* ── Section 5: Save / Discard actions row ─────────────────── */}
        <div className="gsm-card__actions">
          <div className="gsm-card__actions-left">
            {showSavedConfirm && (
              <>
                <span className="gsm-save-dot" aria-hidden="true" />
                <span>Teaching style saved</span>
              </>
            )}
          </div>

          <button
            type="button"
            className="gsm-btn gsm-btn--ghost"
            onClick={onDiscard}
            disabled={isSaving}
          >
            Discard changes
          </button>

          <button
            type="button"
            className="gsm-btn gsm-btn--primary"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save teaching style"
            )}
          </button>
        </div>
      </div>

      {/* ── Section 6: Instruction preview accordion (above generate) ─ */}
      <InstructionPreviewAccordion
        mode={mode}
        modeText={modeText}
        branchDefault={branchDefault}
        previewParts={previewParts}
      />

      {/* ── Section 7: Generate action bar ───────────────────────────── */}
      <GenerateActionBar
        hasWorkspaceStudyMaterial={sm.hasWorkspaceStudyMaterial}
        canClearAllDrafts={sm.canClearAllDrafts}
        clearDraftsBlockReason={sm.clearDraftsBlockReason}
        isGenerating={sm.isGenerating}
        isDeletingDrafts={sm.isDeletingDrafts}
        onOpenExisting={handleOpenExisting}
        onGenerate={handleGenerateClick}
        onRegenerate={handleRegenerate}
      />

      {/* No-Instruction Warning Modal */}
      {showNoInstructionWarning && (
        <>
          <div
            onClick={() => setShowNoInstructionWarning(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 100,
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 110,
              pointerEvents: "none",
            }}
          >
            <div
              className="animate-fade-in"
              style={{
                pointerEvents: "auto",
                width: "min(440px, 95vw)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Generate without instructions?
                </h2>
              </div>

              <div style={{ padding: "1.5rem" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
                  You have not set any teaching style instructions for this topic or section. The AI will write a generic draft.
                </p>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={handleContinueFromWarning}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={handleAddInstructionFromWarning}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    Add instruction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
