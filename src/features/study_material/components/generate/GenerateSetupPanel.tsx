import { FileText, Link2, RefreshCw, Sparkles, Upload } from "lucide-react";
import type { NodeTreeNode, EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { ReferenceMaterialOut } from "../../types/studyMaterial.types";
import type { InstructionMode } from "./instructionMode.types";
import SectionDefaultStyleCard from "./SectionDefaultStyleCard";
import ApproachChooser from "./ApproachChooser";
import InstructionPreviewAccordion from "./InstructionPreviewAccordion";

interface GenerateSetupPanelProps {
  node: NodeTreeNode;
  mode: InstructionMode;
  onModeChange: (m: InstructionMode) => void;
  modeText: string;
  onModeTextChange: (text: string) => void;
  branchDefault: string;
  onBranchDefaultChange: (val: string) => void;
  previewParts: EffectiveInstructionPart[];
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  branchDefaultDirty: boolean;
  approachDirty: boolean;
  referenceMaterial: ReferenceMaterialOut | null;
  nodeMediaCount: number;
  hasWorkspaceStudyMaterial: boolean;
  canClearAllDrafts: boolean;
  clearDraftsBlockReason?: string | null;
  isGenerating: boolean;
  isDeletingDrafts: boolean;
  isWaitingForGenerateAll?: boolean;
  onOpenRefModal: () => void;
  onOpenMediaModal: () => void;
  onOpenExisting: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
}

export default function GenerateSetupPanel({
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
  branchDefaultDirty,
  approachDirty,
  referenceMaterial,
  nodeMediaCount,
  hasWorkspaceStudyMaterial,
  canClearAllDrafts,
  clearDraftsBlockReason,
  isGenerating,
  isDeletingDrafts,
  isWaitingForGenerateAll = false,
  onOpenRefModal,
  onOpenMediaModal,
  onOpenExisting,
  onGenerate,
  onRegenerate,
}: GenerateSetupPanelProps) {
  const isWorking = isGenerating || isDeletingDrafts;
  const blockManualGenerate = isWorking || isWaitingForGenerateAll;

  return (
    <div className="gsm-setup">
      <section className="gsm-setup-hero" aria-labelledby="gsm-setup-hero-title">
        <div className="gsm-setup-hero__layout">
          <div className="gsm-setup-hero__main">
            {hasWorkspaceStudyMaterial && (
              <div className="gsm-ready-status">
                <span className="gsm-ready-status__dot" aria-hidden="true" />
                <span className="gsm-ready-status__text">Draft ready to review</span>
              </div>
            )}

            <p className="gsm-setup-hero__eyebrow">Start here</p>
            <h2 id="gsm-setup-hero-title" className="gsm-setup-hero__title">
              {isWaitingForGenerateAll
                ? "Waiting in generate-all"
                : hasWorkspaceStudyMaterial
                  ? "Your lesson draft is ready"
                  : "Generate your lesson draft"}
            </h2>
            <p className="gsm-setup-hero__sub">
              {isWaitingForGenerateAll
                ? "This topic will start automatically after earlier sections finish."
                : hasWorkspaceStudyMaterial
                  ? `${node.title} already has a draft. Open it to review, or create a new version below.`
                  : "Click below when you're ready. You can customize how AI teaches first — or skip straight to a draft."}
            </p>

            {isWaitingForGenerateAll && !isGenerating && (
              <p className="gsm-ready-waiting">Waiting for generate-all to reach this topic…</p>
            )}

            <div className="gsm-setup-hero__actions">
              {hasWorkspaceStudyMaterial ? (
                <>
                  <button
                    type="button"
                    className="gsm-btn gsm-btn--primary gsm-btn--block gsm-btn--lg"
                    onClick={onOpenExisting}
                  >
                    <FileText size={16} strokeWidth={1.8} aria-hidden />
                    Open your draft
                  </button>
                  <button
                    type="button"
                    className="gsm-btn gsm-btn--outline-primary gsm-btn--block"
                    onClick={onRegenerate}
                    disabled={blockManualGenerate || !canClearAllDrafts}
                    title={
                      isWaitingForGenerateAll
                        ? "Blocked until generate-all reaches this topic"
                        : !canClearAllDrafts
                          ? (clearDraftsBlockReason ?? "Cannot regenerate at this time")
                          : undefined
                    }
                  >
                    <RefreshCw size={14} strokeWidth={1.8} aria-hidden />
                    {isWorking ? "Working…" : "Generate a new draft"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  id="generate-study-material-btn"
                  className="gsm-btn gsm-btn--primary gsm-btn--block gsm-btn--lg"
                  onClick={onGenerate}
                  disabled={blockManualGenerate}
                  title={
                    isWaitingForGenerateAll
                      ? "Blocked until generate-all reaches this topic"
                      : undefined
                  }
                >
                  <Sparkles size={16} strokeWidth={1.8} aria-hidden />
                  {isGenerating
                    ? "Generating…"
                    : isWaitingForGenerateAll
                      ? "Waiting…"
                      : "Generate draft"}
                </button>
              )}
            </div>
          </div>

          <aside className="gsm-setup-hero__extras" aria-label="Optional extras">
            <button
              type="button"
              className="gsm-setup-hero-extra"
              onClick={onOpenRefModal}
              title={
                referenceMaterial
                  ? `Reference: ${referenceMaterial.title}`
                  : "Add a reference PDF for the AI to use"
              }
            >
              <span className="gsm-setup-hero-extra__icon" aria-hidden="true">
                <Upload size={20} strokeWidth={1.8} />
              </span>
              <span className="gsm-setup-hero-extra__title">
                {referenceMaterial ? referenceMaterial.title : "Reference PDF for AI"}
              </span>
              <span className="gsm-setup-hero-extra__sub">
                Optional — material AI reads before writing
              </span>
            </button>

            <button
              type="button"
              className="gsm-setup-hero-extra"
              onClick={onOpenMediaModal}
              title="Images, links and videos for learners"
            >
              <span className="gsm-setup-hero-extra__icon" aria-hidden="true">
                <Link2 size={20} strokeWidth={1.8} />
              </span>
              <span className="gsm-setup-hero-extra__title">For students reference</span>
              <span className="gsm-setup-hero-extra__sub">
                {nodeMediaCount > 0
                  ? `${nodeMediaCount} linked — links, images, or videos`
                  : "Links, images, or videos for students"}
              </span>
            </button>
          </aside>
        </div>
      </section>

      <section className="gsm-setup-card" aria-labelledby="gsm-setup-card-title">
        <div className="gsm-setup-card__intro">
          <h3 id="gsm-setup-card-title" className="gsm-setup-card__title">
            Customize how AI teaches
          </h3>
          <p className="gsm-setup-card__lead">
            Work through the steps below if you want more control.
          </p>
        </div>

        <div className="gsm-setup-step">
          <div className="gsm-setup-step__head">
            <span className="gsm-setup-step__num" aria-hidden="true">
              1
            </span>
            <div>
              <h4 className="gsm-setup-step__title">Default style for this section</h4>
              <p className="gsm-setup-step__hint">
                Applies to {node.title} and every subtopic inside it.
              </p>
            </div>
          </div>
          <SectionDefaultStyleCard
            embedded
            sectionName={node.title}
            hasChildren={node.children.length > 0}
            value={branchDefault}
            onChange={onBranchDefaultChange}
            onSave={onSave}
            isSaving={isSaving}
            isDirty={branchDefaultDirty}
          />
        </div>

        <div className="gsm-setup-step">
          <div className="gsm-setup-step__head">
            <span className="gsm-setup-step__num" aria-hidden="true">
              2
            </span>
            <div>
              <h4 className="gsm-setup-step__title">How AI teaches this topic</h4>
              <p className="gsm-setup-step__hint">
                Add a note for {node.title}, or turn off the default to write custom instructions.
              </p>
            </div>
          </div>
          <ApproachChooser
            embedded
            nodeTitle={node.title}
            mode={mode}
            modeText={modeText}
            onModeChange={onModeChange}
            onModeTextChange={onModeTextChange}
            isApproachDirty={approachDirty}
            isSaving={isSaving}
            onSave={onSave}
            onDiscard={onDiscard}
          />
        </div>

        <InstructionPreviewAccordion
          embedded
          mode={mode}
          modeText={modeText}
          branchDefault={branchDefault}
          previewParts={previewParts}
          isRootTopic={!node.parent_id}
        />
      </section>
    </div>
  );
}
