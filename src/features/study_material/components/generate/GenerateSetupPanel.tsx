import {
  BookOpen,
  FileText,
  Image,
  Pause,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
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
  showSavedConfirm: boolean;
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
  isLoadingGenerationSource: boolean;
  isLoadingTopicResources: boolean;
  isWaitingForGenerateAll?: boolean;
  /** A study-material run is paused (resumable) — block new generation until resumed/deleted. */
  runPaused?: boolean;
  /** A resumable failed run blocks fresh generation until continued or deleted. */
  runFailed?: boolean;
  onOpenRefModal: () => void;
  onOpenMediaModal: () => void;
  onOpenExisting: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onNavigateToNode?: (nodeId: string) => void;
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
  showSavedConfirm,
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
  isLoadingGenerationSource,
  isLoadingTopicResources,
  isWaitingForGenerateAll = false,
  runPaused = false,
  runFailed = false,
  onOpenRefModal,
  onOpenMediaModal,
  onOpenExisting,
  onGenerate,
  onRegenerate,
  onNavigateToNode,
}: GenerateSetupPanelProps) {
  const isWorking = isGenerating || isDeletingDrafts;
  const hasUnsavedSettings = branchDefaultDirty || approachDirty;
  const blockManualGenerate =
    isWorking || isWaitingForGenerateAll || runPaused || runFailed || hasUnsavedSettings;
  const pausedTitle =
    "Generation is paused. Resume or delete it from the Material tab before creating a new draft.";

  return (
    <div className="gsm-setup">
      {showSavedConfirm && (
        <div className="gsm-sync-banner" role="status">
          <span className="gsm-sync-banner__mark" aria-hidden="true">✓</span>
          <div>
            <strong>Style configuration saved</strong>
            <span>The latest teaching instructions will be used for this topic.</span>
          </div>
        </div>
      )}

      <header className="gsm-page-heading">
        <p>Lesson setup</p>
        <h2>Build a lesson for {node.title}</h2>
        <span>Shape the teaching approach, choose what the AI can read, then create a reviewable draft.</span>
      </header>

      {(runPaused || runFailed || isWaitingForGenerateAll || hasWorkspaceStudyMaterial) && (
        <div className={`gsm-run-banner${runPaused || runFailed ? " gsm-run-banner--paused" : ""}`} role="status">
          <div>
            <strong>
              {runPaused
                ? "Generation paused"
                : runFailed
                  ? "Generation needs attention"
                : isWaitingForGenerateAll
                  ? "Queued in Generate All"
                  : "A draft is ready to review"}
            </strong>
            <span>
              {runPaused
                ? "Resume or delete the saved run from Material before starting again."
                : runFailed
                  ? "Continue the saved run after its retry cooldown, or delete it before starting again."
                : isWaitingForGenerateAll
                  ? "This topic starts automatically after the topics ahead of it finish."
                  : `${node.title} already has workspace material. You can review it or replace the unpublished drafts.`}
            </span>
          </div>
          <button type="button" className="gsm-btn gsm-btn--outline-primary" onClick={onOpenExisting}>
            {runPaused || runFailed ? <Pause size={15} aria-hidden /> : <FileText size={15} aria-hidden />}
            {runPaused ? "Open paused run" : runFailed ? "Review failed run" : "Open material"}
          </button>
        </div>
      )}

      <div className="gsm-setup-flow">
        <section className="gsm-setup-step-card" aria-labelledby="gsm-style-step-title">
          <div className="gsm-setup-step__head">
            <span className="gsm-setup-step__num" aria-hidden="true">
              1
            </span>
            <div>
              <h3 id="gsm-style-step-title" className="gsm-setup-step__title">Lesson style</h3>
              <p className="gsm-setup-step__hint">
                Set a reusable teaching standard for {node.title} and its subtopics.
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
            onDiscard={() => onBranchDefaultChange(node.tree_default_instruction ?? "")}
            isSaving={isSaving}
            isDirty={branchDefaultDirty}
          />
        </section>

        <section className="gsm-setup-step-card" aria-labelledby="gsm-instruction-step-title">
          <div className="gsm-setup-step__head">
            <span className="gsm-setup-step__num" aria-hidden="true">
              2
            </span>
            <div>
              <h3 id="gsm-instruction-step-title" className="gsm-setup-step__title">AI generation instructions</h3>
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
        </section>

        <section className="gsm-setup-step-card" aria-labelledby="gsm-source-step-title">
          <div className="gsm-setup-step__head">
            <span className="gsm-setup-step__num" aria-hidden="true">3</span>
            <div>
              <h3 id="gsm-source-step-title" className="gsm-setup-step__title">Sources and learner resources</h3>
              <p className="gsm-setup-step__hint">Generation sources and student-visible resources stay separate.</p>
            </div>
          </div>
          <div className="gsm-source-row">
            <button type="button" className="gsm-source-btn" onClick={onOpenRefModal}>
              <span className="gsm-source-btn__icon" aria-hidden="true"><Upload size={18} /></span>
              <span className="gsm-source-btn__text">
                <b>{isLoadingGenerationSource ? "Loading source…" : referenceMaterial?.title ?? "Upload a source PDF"}</b>
                <span>Private input the AI reads while writing</span>
              </span>
              {referenceMaterial && <span className="gsm-badge-count">1 source</span>}
            </button>
            <button type="button" className="gsm-source-btn" onClick={onOpenMediaModal}>
              <span className="gsm-source-btn__icon" aria-hidden="true"><Image size={18} /></span>
              <span className="gsm-source-btn__text">
                <b>{isLoadingTopicResources ? "Loading resources…" : "Student resources"}</b>
                <span>Visible links, images, PDFs, and videos</span>
              </span>
              {nodeMediaCount > 0 && <span className="gsm-badge-count">{nodeMediaCount}</span>}
            </button>
          </div>
          <div className="gsm-source-separation-note">
            <BookOpen size={15} aria-hidden />
            Student resources are not automatically used as AI generation context.
          </div>
        </section>

        <section className="gsm-setup-step-card gsm-setup-step-card--preview">
          <InstructionPreviewAccordion
            embedded
            mode={mode}
            modeText={modeText}
            branchDefault={branchDefault}
            previewParts={previewParts}
            isRootTopic={!node.parent_id}
            hasUnsavedChanges={hasUnsavedSettings}
            generationSourceTitle={referenceMaterial?.title ?? null}
            learnerResourceCount={nodeMediaCount}
            onNavigateToNode={onNavigateToNode}
          />
        </section>
      </div>

      <section className="gsm-final-action" aria-label="Create lesson draft">
        <div>
          <h3>{hasWorkspaceStudyMaterial ? "Create a fresh lesson draft" : "Ready to create the lesson?"}</h3>
          <p>
            {hasUnsavedSettings
              ? "Save your instruction changes above before starting generation."
              : "The run is durable. You can leave this topic and return while generation continues."}
          </p>
        </div>
        {runPaused || runFailed ? (
          <button type="button" className="gsm-btn gsm-btn--primary gsm-btn--lg" onClick={onOpenExisting}>
            <Pause size={16} aria-hidden /> {runPaused ? "Go to paused run" : "Review failed run"}
          </button>
        ) : hasWorkspaceStudyMaterial ? (
          <button
            type="button"
            className="gsm-btn gsm-btn--primary gsm-btn--lg"
            onClick={onRegenerate}
            disabled={blockManualGenerate || !canClearAllDrafts}
            title={
              hasUnsavedSettings
                ? "Save instruction changes before generating"
                : isWaitingForGenerateAll
                ? "Blocked until Generate All reaches this topic"
                : !canClearAllDrafts
                  ? (clearDraftsBlockReason ?? "Cannot regenerate at this time")
                  : undefined
            }
          >
            <RefreshCw size={16} aria-hidden />
            {isWorking ? "Working…" : "Generate new draft"}
          </button>
        ) : (
          <button
            type="button"
            id="generate-study-material-btn"
            className="gsm-btn gsm-btn--primary gsm-btn--lg"
            onClick={onGenerate}
            disabled={blockManualGenerate}
            title={
              hasUnsavedSettings
                ? "Save instruction changes before generating"
                : runPaused
                  ? pausedTitle
                  : isWaitingForGenerateAll
                    ? "Waiting in Generate All"
                    : undefined
            }
          >
            <Sparkles size={17} aria-hidden />
            {isGenerating ? "Generating…" : isWaitingForGenerateAll ? "Waiting…" : "Create lesson draft with AI"}
          </button>
        )}
      </section>
    </div>
  );
}
