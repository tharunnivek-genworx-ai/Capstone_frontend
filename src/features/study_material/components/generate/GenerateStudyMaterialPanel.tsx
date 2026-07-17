// GenerateStudyMaterialPanel.tsx
import { useCallback, useEffect, useState } from "react";
import ModalPortal from "../../../../components/ModalPortal";
import "../../styles/generateStudyMaterial.css";
import type { NodeTreeNode, EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";
import type { InstructionMode } from "./instructionMode.types";
import {
  isApproachDirty as checkApproachDirty,
} from "./instructionModeUtils";
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
  /** A study-material run is paused (resumable). Blocks new generation until resumed/deleted. */
  runPaused?: boolean;
  /** A failed durable run can still be resumed or deleted from Material. */
  runFailed?: boolean;
}

function isApproachDirty(
  node: NodeTreeNode,
  mode: InstructionMode,
  modeText: string
): boolean {
  return checkApproachDirty(node, mode, modeText);
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
  isWaitingForGenerateAll = false,
  runPaused = false,
  runFailed = false,
}: GenerateStudyMaterialPanelProps) {
  const [showNoInstructionWarning, setShowNoInstructionWarning] = useState(false);

  useEffect(() => {
    if (!showNoInstructionWarning) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowNoInstructionWarning(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showNoInstructionWarning]);

  const branchDefaultDirty =
    branchDefault.trim() !== (node.tree_default_instruction ?? "").trim();
  const approachDirty = isApproachDirty(node, mode, modeText);

  const handleOpenExisting = useCallback(() => sm.setCurrentPage(2), [sm]);

  const handleGenerateClick = useCallback(() => {
    if (runPaused || runFailed) return;
    if (isWaitingForGenerateAll && !sm.isGenerating) return;
    if (branchDefaultDirty || approachDirty) return;

    const ignoringSectionDefaults = mode === "replace" && !modeText.trim();
    if (ignoringSectionDefaults) {
      void sm.handleGenerateStudyMaterial();
      return;
    }

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
  }, [
    previewParts,
    mode,
    modeText,
    branchDefault,
    branchDefaultDirty,
    approachDirty,
    sm,
    isWaitingForGenerateAll,
    runPaused,
    runFailed,
  ]);

  const handleContinueFromWarning = useCallback(() => {
    if (runPaused || runFailed) return;
    if (isWaitingForGenerateAll && !sm.isGenerating) return;
    setShowNoInstructionWarning(false);
    void sm.handleGenerateStudyMaterial();
  }, [sm, isWaitingForGenerateAll, runPaused, runFailed]);

  const handleRegenerate = useCallback(() => {
    if (runPaused || runFailed) return;
    if (isWaitingForGenerateAll && !sm.isGenerating) return;
    if (branchDefaultDirty || approachDirty) return;
    sm.setShowRegenerateConfirmModal(true);
  }, [
    sm,
    isWaitingForGenerateAll,
    runPaused,
    runFailed,
    branchDefaultDirty,
    approachDirty,
  ]);

  const handleAddInstructionFromWarning = useCallback(() => {
    setShowNoInstructionWarning(false);
    setTimeout(() => {
      document.getElementById("gsm-topic-instruction-textarea")?.focus();
      document.getElementById("gsm-approach-card")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  }, []);

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
        showSavedConfirm={showSavedConfirm}
        onSave={onSave}
        onDiscard={onDiscard}
        branchDefaultDirty={branchDefaultDirty}
        approachDirty={approachDirty}
        referenceMaterial={sm.referenceMaterial}
        externalResearchEnabled={sm.externalResearchEnabled}
        onExternalResearchChange={sm.setExternalResearchEnabled}
        nodeMediaCount={sm.nodeMedia.length}
        hasWorkspaceStudyMaterial={sm.hasWorkspaceStudyMaterial}
        canClearAllDrafts={sm.canClearAllDrafts}
        clearDraftsBlockReason={sm.clearDraftsBlockReason}
        isGenerating={sm.isGenerating}
        isDeletingDrafts={sm.isDeletingDrafts}
        isLoadingGenerationSource={sm.isLoadingGenerationSource}
        isLoadingTopicResources={sm.isLoadingTopicResources}
        isWaitingForGenerateAll={isWaitingForGenerateAll && !sm.isGenerating}
        runPaused={runPaused}
        runFailed={runFailed}
        onOpenRefModal={onOpenRefModal}
        onOpenMediaModal={onOpenMediaModal}
        onOpenExisting={handleOpenExisting}
        onGenerate={handleGenerateClick}
        onRegenerate={handleRegenerate}
        onNavigateToNode={onNavigateToNode}
      />

      {showNoInstructionWarning && (
        <ModalPortal>
          <div
            onClick={() => setShowNoInstructionWarning(false)}
            className="gsm-queue-modal__backdrop"
          />
          <div className="gsm-queue-modal__layer">
            <div
              className="gsm-queue-modal animate-fade-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gsm-no-instruction-warning-title"
            >
              <div className="gsm-queue-modal__header gsm-queue-modal__header--warning">
                <span>Before generation</span>
                <h2 id="gsm-no-instruction-warning-title">
                  Generate without instructions?
                </h2>
              </div>

              <div className="gsm-queue-modal__body">
                <p className="gsm-queue-modal__copy">
                  You haven&apos;t set any teaching instructions for this topic or
                  section. The AI will write a generic draft.
                </p>
              </div>
              <div className="gsm-queue-modal__footer">
                <span />
                <div>
                  <button
                    type="button"
                    onClick={handleContinueFromWarning}
                    className="as-button as-button--secondary"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={handleAddInstructionFromWarning}
                    className="as-button as-button--primary"
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
