// src/features/spaces/components/NodeDetailPanel.tsx
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import type {
  NodeTreeNode,
  NodeUpdateInstructionRequest,
} from "../types/node.types";
import {
  useStudyMaterial,
  type NodeStudyStatePatch,
} from "../../study_material/hooks/useStudyMaterial";
import { useQuiz } from "../../quiz/hooks/useQuiz";
import type { NodeStudyState } from "../../study_material/types/studyMaterial.types";
import StudentVisibilityBanner from "../../study_material/components/material/StudentVisibilityBanner";
import StudyMaterialFeedbackModal from "../../study_material/components/material/StudyMaterialFeedbackModal";
import StudyMaterialManualEditor from "../../study_material/components/material/StudyMaterialManualEditor";
import TopicPageNav from "./TopicPageNav";
import ReferenceMaterialModal from "../../study_material/components/reference/ReferenceMaterialModal";
import NodeMediaModal from "../../study_material/components/reference/NodeMediaModal";
import GenerateStudyMaterialPanel from "../../study_material/components/generate/GenerateStudyMaterialPanel";
import StudyMaterialFocusModal from "../../study_material/components/material/StudyMaterialFocusModal";
import DeleteDraftConfirmModal from "../../study_material/components/version/DeleteDraftConfirmModal";
import RegenerateStudyMaterialConfirmModal from "../../study_material/components/version/RegenerateStudyMaterialConfirmModal";
import StudyMaterialPublishConfirmModal from "../../study_material/components/version/StudyMaterialPublishConfirmModal";
import StudyMaterialUnpublishConfirmModal from "../../study_material/components/version/StudyMaterialUnpublishConfirmModal";
import StudyMaterialMentorWorkspace from "../../study_material/components/material/StudyMaterialMentorWorkspace";
import EspaceNotPublishedModal from "../../study_material/components/space/EspaceNotPublishedModal";
import QuizPage3 from "../../quiz/components/QuizPage3";
import QuizPage4 from "../../quiz/components/QuizPage4";
import GenerationProgressPanel from "../../generation/components/GenerationProgressPanel";
import { useGenerationProgress } from "../../generation/hooks/useGenerationProgress";
import type { InstructionMode } from "../../study_material/components/generate/instructionMode.types";

// Re-export for consumers that import from here
export type { NodeStudyStatePatch };

function nonempty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t || null;
}

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


interface NodeDetailPanelProps {
  node: NodeTreeNode | null;
  spaceId: string;
  spaceIsPublished?: boolean;
  onRename: (nodeId: string, newTitle: string) => Promise<void>;
  onUpdateInstruction: (nodeId: string, payload: NodeUpdateInstructionRequest) => Promise<void>;
  onNavigateToNode: (nodeId: string) => void;
  isMentor?: boolean;
  studyState?: NodeStudyState;
  onStudyStateChange?: (nodeId: string, patch: NodeStudyStatePatch) => void;
  onMentorProgressRefresh?: () => void;
  contentRefreshToken?: number;
  /** Block manual Generate while this node is still waiting in generate-all. */
  isWaitingForGenerateAll?: boolean;
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
  onMentorProgressRefresh,
  contentRefreshToken = 0,
  isWaitingForGenerateAll = false,
}) => {
  // ── Instruction editing state (stays local — not study material) ─────────
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenameSaving, setIsRenameSaving] = useState(false);
  const [mode, setMode] = useState<InstructionMode>("inherit");
  const [modeText, setModeText] = useState("");
  const [branchDefault, setBranchDefault] = useState("");
  const [isSavingInstruction, setIsSavingInstruction] = useState(false);
  const [showSavedConfirm, setShowSavedConfirm] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);

  // ── Study material hook ─────────────────────────────────────────────────
  const sm = useStudyMaterial({
    node,
    spaceId,
    spaceIsPublished,
    isMentor,
    studyState,
    onStudyStateChange,
    onMentorProgressRefresh,
    contentRefreshToken,
  });

  const showGenerationProgress = sm.isGenerating;
  const studyGenerationProgress = useGenerationProgress(
    sm.generationProgressSessionId,
    showGenerationProgress,
  );

  // ── Quiz hook ─────────────────────────────────────────────────────────────
  const qz = useQuiz({
    node,
    isMentor,
    spaceIsPublished,
    currentPage: sm.currentPage,
    canAccessQuiz: sm.canAccessQuiz,
    currentQuizId: studyState?.currentQuizId ?? null,
    isGeneratingQuiz: studyState?.isGeneratingQuiz ?? false,
    isGeneratingHints: studyState?.isGeneratingHints ?? false,
    generationProgressSessionId: studyState?.generationProgressSessionId ?? null,
    onNodeStudyStateChange: onStudyStateChange,
    onPageChange: sm.setCurrentPage,
    onMentorProgressRefresh,
    contentRefreshToken,
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

  const renderGenerationSourceButton = (extraClassName = "") => (
    <button
      type="button"
      className={`btn-secondary reference-materials-trigger reference-materials-trigger--generation ${extraClassName}`.trim()}
      onClick={() => {
        if (sm.currentPage === 2) {
          sm.openRefModalView();
        } else {
          sm.openRefModalManage();
        }
      }}
      title="PDF or document used by the AI when generating study material"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        {sm.referenceMaterial
          ? <polyline points="20 6 9 17 4 12" />
          : <><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></>
        }
      </svg>
      {sm.referenceMaterial ? sm.referenceMaterial.title : "Source document"}
    </button>
  );

  const renderTopicResourcesButton = (extraClassName = "") => (
    <button
      type="button"
      className={`btn-secondary reference-materials-trigger reference-materials-trigger--resources ${extraClassName}`.trim()}
      onClick={() => sm.setShowNodeMediaModal(true)}
      title="Images, links, and videos for trainees — not used by the AI generator"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      {sm.nodeMedia.length > 0
        ? `Topic resources (${sm.nodeMedia.length})`
        : "Topic resources"}
    </button>
  );

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

  const resetFromNode = useCallback(() => {
    if (!node) return;
    const detected = detectMode(node);
    setMode(detected);
    if (detected === "replace") setModeText(node.node_specific_instruction ?? "");
    else if (detected === "extend") setModeText(node.node_additive_instruction ?? "");
    else setModeText("");
    setBranchDefault(node.tree_default_instruction ?? "");
  }, [node]);

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
      <div className="node-detail-panel__header" style={{ flexShrink: 0 }}>
        <div className="node-detail-panel__header-row">
          {/* Left: title */}
          <div className="node-detail-panel__title-block">
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
                {sm.currentPage === 1 && (
                  <p className="node-detail-panel__page1-subtitle">
                    Set up how AI should teach this topic, then create the lesson.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Right: pagination */}
          {isMentor && !isRenaming && (() => {
            // ── Compute accurate tab tooltips from backend state ─────────────
            // Quiz tab: three distinct locked states
            let quizDisabledTooltip: string;
            if (!sm.canAccessQuiz) {
              if (!sm.mentorUiState?.has_versions) {
                quizDisabledTooltip = "Generate study material first";
              } else if (spaceIsPublished === false) {
                quizDisabledTooltip = "Publish the space to access Quiz";
              } else {
                quizDisabledTooltip = "Generate study material first";
              }
            } else {
              quizDisabledTooltip = "Generate study material first";
            }

            // Hints tab: locked until a quiz exists
            let hintsDisabledTooltip: string;
            if (!qz.canAccessHints && qz.quizDraftExists) {
              hintsDisabledTooltip = qz.hintsLockedTooltip ?? "Quiz must be in an accessible state to view Hints";
            } else {
              hintsDisabledTooltip = "Generate a quiz first";
            }

            return (
              <div className="node-detail-panel__nav">
                <TopicPageNav
                  currentPage={sm.currentPage}
                  canAccessStudyMaterial={sm.canAccessStudyMaterial || sm.isGenerating}
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
      <div className="node-detail-panel__body" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Mentor pages */}
        {isMentor && (
          <>
        {/* PAGE 1 — Generate / AI Draft */}
        {sm.currentPage === 1 && (
          <div className="node-detail-panel__page1" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <GenerateStudyMaterialPanel
              node={node}
              mode={mode}
              onModeChange={handleModeChange}
              modeText={modeText}
              onModeTextChange={setModeText}
              branchDefault={branchDefault}
              onBranchDefaultChange={setBranchDefault}
              previewParts={previewParts}
              isSaving={isSavingInstruction}
              showSavedConfirm={showSavedConfirm}
              onSave={handleSaveInstruction}
              onDiscard={resetFromNode}
              onNavigateToNode={onNavigateToNode}
              sm={sm}
              onOpenRefModal={() => sm.openRefModalManage()}
              onOpenMediaModal={() => sm.setShowNodeMediaModal(true)}
              isWaitingForGenerateAll={isWaitingForGenerateAll}
            />
          </div>
        )}

        {/* PAGE 2 — Study material */}
        {sm.currentPage === 2 && (
          <div className="study-material-page">
            {instructionChangeBanner}
            {showGenerationProgress ? (
              <GenerationProgressPanel
                title={sm.processingLabel ?? "Working on study material"}
                subtitle={`The AI is updating study content for "${node.title}". This may take a minute.`}
                progress={studyGenerationProgress}
              />
            ) : sm.isHistoryHubView || sm.studyMaterialContent?.trim() ? (
              <>
                {isMentor &&
                  !sm.isManualEditMode &&
                  !sm.isHistoryHubView &&
                  sm.mentorUiState?.student_visibility && (
                  <StudentVisibilityBanner
                    visibility={sm.mentorUiState.student_visibility}
                    onShowStudentArchive={sm.expandStudentArchive}
                  />
                )}
                {isMentor && sm.isManualEditMode && sm.studyMaterialContent ? (
                  <StudyMaterialManualEditor
                    initialContent={sm.studyMaterialContent}
                    title={node.title}
                    versionLabel={sm.activeVersion?.display_label ?? null}
                    isSaving={sm.isSavingManualEdit}
                    onCancel={() => sm.setIsManualEditMode(false)}
                    onSave={sm.handleManualEditSave}
                  />
                ) : (
                  <StudyMaterialMentorWorkspace
                    node={node}
                    sm={sm}
                    qz={qz}
                    spaceIsPublished={spaceIsPublished}
                    onOpenFocusView={() => setShowFocusModal(true)}
                    renderGenerationSourceButton={renderGenerationSourceButton}
                    renderTopicResourcesButton={renderTopicResourcesButton}
                  />
                )}
              </>
            ) : sm.isLoadingVersions || sm.versionHistory.length > 0 ? (
              <div className="study-material-loading">
                <span className="spinner study-material-loading__spinner" />
                <p className="study-material-loading__title">Loading study material</p>
                <p className="study-material-loading__subtitle">
                  Fetching the latest version for this topic…
                </p>
              </div>
            ) : (
              <div className="study-material-loading">
                <p className="study-material-loading__title">No study material yet</p>
                <p className="study-material-loading__subtitle">
                  Go to Generate and click Generate draft to create content for this topic.
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
          onConfirm={(mode) => void sm.confirmPublish(mode)}
          isSubmitting={sm.isPublishingVersion}
          transactionError={sm.publishTransactionError}
        />
      )}

      {isMentor && sm.unpublishPreview && (
        <StudyMaterialUnpublishConfirmModal
          preview={sm.unpublishPreview}
          onClose={sm.closeUnpublishModal}
          onConfirm={(mode) => void sm.confirmUnpublish(mode)}
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
          sourceDocMismatch={sm.sourceDocMismatch}
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
          mode={sm.refModalMode}
          versionReferenceMaterialId={sm.activeVersion?.reference_material_id ?? null}
          existing={sm.referenceMaterial}
          focusDropzone={sm.refModalFocusDropzone}
          onClose={() => {
            sm.setShowRefModal(false);
            sm.setRefModalFocusDropzone(false);
          }}
          onRequestReplace={sm.handleRequestReplaceSource}
          onUploaded={(mat) => {
            sm.setReferenceMaterialForNode(node.node_id, mat);
            sm.setShowRefModal(false);
            sm.setRefModalFocusDropzone(false);
          }}
          onDeleted={() => {
            sm.setReferenceMaterialForNode(node.node_id, null);
            sm.setShowRefModal(false);
            sm.setRefModalFocusDropzone(false);
          }}
        />
      )}

      {isMentor && sm.showNodeMediaModal && (
        <NodeMediaModal
          nodeId={node.node_id}
          nodeTitle={node.title}
          nodeMedia={sm.nodeMedia}
          onClose={() => sm.setShowNodeMediaModal(false)}
          onRefresh={sm.refreshTopicResources}
        />
      )}

      {isMentor && showFocusModal && sm.studyMaterialContent && (
        <StudyMaterialFocusModal
          nodeId={node.node_id}
          title={node.title}
          content={sm.studyMaterialContent}
          versionLabel={sm.displayedVersionSummary?.display_label ?? sm.activeVersion?.display_label ?? null}
          referenceMaterialId={
            sm.activeVersion?.reference_material_id ??
            sm.referenceMaterial?.material_id ??
            null
          }
          referenceImagesRefreshKey={
            sm.viewingVersionId ?? sm.activeVersion?.version_id ?? sm.studyMaterialContent
          }
          lineageChain={sm.displayedVersionSummary?.lineage_chain ?? []}
          onSelectLineageVersion={sm.handleSelectVersion}
          onClose={() => setShowFocusModal(false)}
        />
      )}
    </div>
  );
};

export default NodeDetailPanel;
