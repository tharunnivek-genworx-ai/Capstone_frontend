// GenerateStudyMaterialPanel.tsx
import { useCallback, useState } from "react";
import ModalPortal from "../../../../components/ModalPortal";
import "../../styles/generateStudyMaterial.css";
import type { NodeTreeNode, EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";
import type { InstructionMode } from "./instructionMode.types";
import GenerateSetupPanel from "./GenerateSetupPanel";

export interface GenerateStudyMaterialPanelProps {
  node: NodeTreeNode;
  mode: InstructionMode;
  onModeChange: (m: InstructionMode) => void;
  modeText: string;
  onModeTextChange: (text: string) => void;
  branchDefault: string;
  onBranchDefaultChange: (val: string) => void;
  previewParts: EffectiveInstructionPart[];
  isSaving: boolean;
  showSavedConfirm: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onNavigateToNode: (nodeId: string) => void;
  sm: UseStudyMaterialReturn;
  onOpenRefModal: () => void;
  onOpenMediaModal: () => void;
  isWaitingForGenerateAll?: boolean;
}

function detectSavedMode(node: NodeTreeNode): InstructionMode {
  if ((node.node_specific_instruction ?? "").trim()) return "replace";
  if ((node.node_additive_instruction ?? "").trim()) return "extend";
  return "inherit";
}

function getSavedModeText(node: NodeTreeNode, savedMode: InstructionMode): string {
  if (savedMode === "replace") return (node.node_specific_instruction ?? "").trim();
  if (savedMode === "extend") return (node.node_additive_instruction ?? "").trim();
  return "";
}

function isApproachDirty(
  node: NodeTreeNode,
  mode: InstructionMode,
  modeText: string
): boolean {
  const savedMode = detectSavedMode(node);
  if (mode !== savedMode) return true;
  return modeText.trim() !== getSavedModeText(node, savedMode);
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
  onSave,
  onDiscard,
  sm,
  onOpenRefModal,
  onOpenMediaModal,
  isWaitingForGenerateAll = false,
}: GenerateStudyMaterialPanelProps) {
  const [showNoInstructionWarning, setShowNoInstructionWarning] = useState(false);

  const branchDefaultDirty =
    branchDefault.trim() !== (node.tree_default_instruction ?? "").trim();
  const approachDirty = isApproachDirty(node, mode, modeText);

  const handleOpenExisting = useCallback(() => sm.setCurrentPage(2), [sm]);

  const handleGenerateClick = useCallback(() => {
    if (isWaitingForGenerateAll && !sm.isGenerating) return;
    const hasInherited = previewParts.some(
      (p) => p.type === "inherited" || p.type === "branch-default"
    );
    const hasLocal =
      (mode === "extend" || mode === "replace") && modeText.trim().length > 0;
    const hasBranchDefault = branchDefault.trim().length > 0;
    const hasAnyInstruction = hasInherited || hasLocal || hasBranchDefault;

    if (!hasAnyInstruction) {
      setShowNoInstructionWarning(true);
    } else {
      void sm.handleGenerateStudyMaterial();
    }
  }, [previewParts, mode, modeText, branchDefault, sm, isWaitingForGenerateAll]);

  const handleContinueFromWarning = useCallback(() => {
    if (isWaitingForGenerateAll && !sm.isGenerating) return;
    setShowNoInstructionWarning(false);
    void sm.handleGenerateStudyMaterial();
  }, [sm, isWaitingForGenerateAll]);

  const handleRegenerate = useCallback(() => {
    if (isWaitingForGenerateAll && !sm.isGenerating) return;
    sm.setShowRegenerateConfirmModal(true);
  }, [sm, isWaitingForGenerateAll]);

  const handleAddInstructionFromWarning = useCallback(() => {
    setShowNoInstructionWarning(false);
    onModeChange("extend");
    setTimeout(() => {
      document.getElementById("gsm-extend-textarea")?.focus();
      document.getElementById("gsm-approach-card")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  }, [onModeChange]);

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
      {instructionChangeBanner}

      <GenerateSetupPanel
        node={node}
        mode={mode}
        onModeChange={onModeChange}
        modeText={modeText}
        onModeTextChange={onModeTextChange}
        branchDefault={branchDefault}
        onBranchDefaultChange={onBranchDefaultChange}
        previewParts={previewParts}
        isSaving={isSaving}
        onSave={onSave}
        onDiscard={onDiscard}
        branchDefaultDirty={branchDefaultDirty}
        approachDirty={approachDirty}
        referenceMaterial={sm.referenceMaterial}
        nodeMediaCount={sm.nodeMedia.length}
        hasWorkspaceStudyMaterial={sm.hasWorkspaceStudyMaterial}
        canClearAllDrafts={sm.canClearAllDrafts}
        clearDraftsBlockReason={sm.clearDraftsBlockReason}
        isGenerating={sm.isGenerating}
        isDeletingDrafts={sm.isDeletingDrafts}
        isWaitingForGenerateAll={isWaitingForGenerateAll && !sm.isGenerating}
        onOpenRefModal={onOpenRefModal}
        onOpenMediaModal={onOpenMediaModal}
        onOpenExisting={handleOpenExisting}
        onGenerate={handleGenerateClick}
        onRegenerate={handleRegenerate}
      />

      {showNoInstructionWarning && (
        <ModalPortal>
          <div
            onClick={() => setShowNoInstructionWarning(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 120,
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
              zIndex: 130,
              pointerEvents: "none",
            }}
          >
            <div
              className="animate-fade-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gsm-no-instruction-warning-title"
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
                <h2
                  id="gsm-no-instruction-warning-title"
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Generate without instructions?
                </h2>
              </div>

              <div style={{ padding: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    margin: "0 0 1.5rem",
                    lineHeight: 1.6,
                  }}
                >
                  You haven&apos;t set any teaching instructions for this topic or
                  section. The AI will write a generic draft.
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
                    Add a note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
