import React from "react";
import { Download, Maximize2, Zap } from "lucide-react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";
import type { UseQuizReturn } from "../../../quiz/hooks/useQuiz";
import StudyMaterialViewer from "./StudyMaterialViewer";
import StudyMaterialHistoryHub from "./StudyMaterialHistoryHub";
import StudentVisibilityBanner from "./StudentVisibilityBanner";
import StudyMaterialVersionPanel from "../version/StudyMaterialVersionPanel";
import StudyMaterialQcWarningPanel from "../shared/StudyMaterialQcWarningPanel";
import { shouldShowQcWarning } from "../../utils/qcDisplayUtils";
import VersionLineageInfo from "../version/VersionLineageInfo";
import "../../styles/studyMaterialMentor.css";

interface StudyMaterialMentorWorkspaceProps {
  node: NodeTreeNode;
  sm: UseStudyMaterialReturn;
  qz: UseQuizReturn;
  spaceIsPublished?: boolean;
  onOpenFocusView: () => void;
  renderGenerationSourceButton: (className?: string) => React.ReactNode;
  renderTopicResourcesButton: (className?: string) => React.ReactNode;
}

function versionBarTag(
  sm: UseStudyMaterialReturn
): { label: string; modifier: "draft" | "live" | "muted" } | null {
  if (sm.isDisplayedActiveWorkingDraft) {
    return { label: "Working draft", modifier: "draft" };
  }

  const badge = sm.displayedVersionSummary?.mentor_display_badge;
  if (badge === "Live for students") {
    return { label: "Live for students", modifier: "live" };
  }
  if (badge === "Removed from students") {
    return { label: "Removed from students", modifier: "muted" };
  }
  if (badge === "In your archive") {
    return { label: "In your archive", modifier: "muted" };
  }
  if (badge === "Previous for students" || badge === "In student archive") {
    return { label: "In student archive", modifier: "muted" };
  }
  return null;
}

const StudyMaterialMentorWorkspace: React.FC<StudyMaterialMentorWorkspaceProps> = ({
  node,
  sm,
  qz,
  spaceIsPublished,
  onOpenFocusView,
  renderGenerationSourceButton,
  renderTopicResourcesButton,
}) => {
  const showQcWarning = shouldShowQcWarning(
    sm.activeVersion?.qc_failed_permanently,
    sm.activeVersion?.qc_result,
  );
  const versionTag = versionBarTag(sm);
  const showBackToHistory = sm.isHistoryDetailView;
  const showBackToWorkspace =
    !sm.shouldShowHistoryHub && (sm.showArchivedPanel || sm.isViewingArchivedVersion);

  const handleBackToWorkspace = () => {
    if (sm.isViewingArchivedVersion && sm.activeVersion) {
      void sm.handleReturnToActiveDraft();
    } else {
      sm.setShowArchivedPanel(false);
    }
  };

  if (sm.isHistoryHubView) {
    return (
      <div className="study-material-page__mentor-layout">
        {sm.mentorUiState?.student_visibility && (
          <StudentVisibilityBanner visibility={sm.mentorUiState.student_visibility} />
        )}
        <StudyMaterialHistoryHub
          partitions={sm.historyPartitions}
          onSelectVersion={sm.handleSelectVersion}
          onGoToGeneratePage={() => sm.setCurrentPage(1)}
        />
      </div>
    );
  }

  return (
    <div className="study-material-page__mentor-layout">
      {sm.isViewingArchivedVersion && !sm.isHistoryDetailView && (
        <div className="study-material-page__draft-notice-band">
          <div className="study-material-page__viewing-notice">
            <div className="study-material-page__viewing-banner study-material-page__viewing-banner--archived">
              <span>Viewing an archived draft — not in your working drafts.</span>
            </div>
            {sm.displayedVersionId && (
              <button
                type="button"
                className="btn-primary study-material-page__activate-btn"
                onClick={sm.handleUnarchiveCurrentVersion}
                disabled={sm.isUnarchivingVersion}
              >
                {sm.isUnarchivingVersion ? "Restoring…" : "Restore to drafts"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="sm-mentor-toolbar" role="toolbar" aria-label="Study material actions">
        <div className="sm-mentor-toolbar__group">
          <button
            type="button"
            className={`sm-mentor-btn sm-mentor-btn--ghost sm-mentor-toolbar__archive-toggle${
              sm.showArchivedPanel ? " sm-mentor-toolbar__archive-toggle--active" : ""
            }`}
            onClick={() => sm.setShowArchivedPanel((v) => !v)}
            title="View drafts in your archive"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            Archive
            {sm.archivedVersionHistory.length > 0 && (
              <span className="sm-mentor-toolbar__archive-count">{sm.archivedVersionHistory.length}</span>
            )}
          </button>
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--ghost sm-mentor-btn--danger"
            onClick={() => sm.setShowDeleteDraftModal(true)}
            disabled={!sm.canClearAllDrafts || sm.isDeletingDrafts}
            title={
              sm.canClearAllDrafts
                ? "Discard unpublished drafts from your workspace"
                : sm.clearDraftsBlockReason
            }
          >
            Discard drafts
          </button>
          {Boolean(sm.activeVersion?.reference_material_id) &&
            renderGenerationSourceButton("sm-mentor-btn sm-mentor-btn--ghost")}
          {renderTopicResourcesButton("sm-mentor-btn sm-mentor-btn--ghost")}
        </div>

        <div className="sm-mentor-toolbar__divider" aria-hidden />

        {sm.showSourceDocMismatchBanner && (
          <div
            className="study-material-source-doc-mismatch-banner"
            role="status"
          >
            <span>
              This draft was generated from a different source document. Regenerating will use the new PDF
              and delete existing drafts; older content may no longer match.
            </span>
            <button
              type="button"
              className="study-material-source-doc-mismatch-banner__dismiss"
              onClick={sm.dismissSourceDocMismatchBanner}
              aria-label="Dismiss warning"
            >
              Dismiss
            </button>
          </div>
        )}

        {sm.sourcePdfDeleted && (
          <div
            className="study-material-source-pdf-deleted-banner"
            role="status"
          >
            <span>
              The reference PDF used to generate this draft has been removed. Regenerate and Improve are
              unavailable until you upload a new source document, or you discard drafts and generate fresh
              from page 1 without a reference PDF.
            </span>
          </div>
        )}

        <div className="sm-mentor-toolbar__group">
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--outline"
            onClick={() => sm.openFeedbackModal("regenerate")}
            disabled={!sm.canRegenerateOrImproveDraft}
            title={
              sm.sourcePdfDeleted
                ? sm.sourcePdfDeletedBlockReason
                : sm.canEditActiveDraft
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
            className="sm-mentor-btn sm-mentor-btn--outline"
            onClick={() => sm.openFeedbackModal("improve")}
            disabled={!sm.canRegenerateOrImproveDraft}
            title={
              sm.sourcePdfDeleted
                ? sm.sourcePdfDeletedBlockReason
                : sm.canEditActiveDraft
                  ? undefined
                  : "Return to the active draft to improve it"
            }
          >
            Improve
          </button>
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--outline"
            onClick={() => sm.setIsManualEditMode(true)}
            disabled={!sm.canEditActiveDraft}
            title={sm.canEditActiveDraft ? undefined : "Return to the active draft to edit it"}
          >
            Manual edit
          </button>
        </div>

        <div className="sm-mentor-toolbar__spacer" />

        {(sm.canUnpublishDisplayedVersion || sm.unpublishDisabledTooltip) && (
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--outline sm-mentor-btn--danger"
            onClick={sm.canUnpublishDisplayedVersion ? sm.handleUnpublishCurrentVersion : undefined}
            disabled={!sm.canUnpublishDisplayedVersion || sm.isPublishingVersion || sm.isUnpublishingVersion}
            title={
              !sm.canUnpublishDisplayedVersion
                ? sm.unpublishDisabledTooltip ?? undefined
                : sm.unpublishTooltip ?? undefined
            }
          >
            {sm.isUnpublishingVersion ? "Removing…" : sm.unpublishButtonLabel}
          </button>
        )}

        {(sm.canPublishDisplayedVersion || sm.publishDisabledTooltip) && (
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--primary"
            onClick={sm.canPublishDisplayedVersion ? sm.handlePublishCurrentVersion : undefined}
            disabled={!sm.canPublishDisplayedVersion || sm.isPublishingVersion || sm.isUnpublishingVersion}
            title={!sm.canPublishDisplayedVersion ? sm.publishDisabledTooltip ?? undefined : undefined}
          >
            {sm.isPublishingVersion ? "Making live…" : sm.publishButtonLabel}
          </button>
        )}
      </div>

      {sm.displayedVersionBaseLabel && (
        <div className="sm-version-bar">
          {showBackToHistory && (
            <button
              type="button"
              className="sm-version-bar__back-link"
              onClick={sm.handleBackToHistory}
            >
              ← Back to history
            </button>
          )}
          {showBackToWorkspace && (
            <button
              type="button"
              className="sm-version-bar__back-link"
              onClick={handleBackToWorkspace}
            >
              ← Back to workspace
            </button>
          )}
          <span className="sm-version-pill">
            {sm.displayedVersionBaseLabel}
            {versionTag && (
              <span className={`sm-version-tag sm-version-tag--${versionTag.modifier}`}>
                {versionTag.label}
              </span>
            )}
          </span>

          {sm.canArchiveDisplayedVersion && (
            <button
              type="button"
              className="sm-mentor-btn sm-mentor-btn--ghost"
              onClick={sm.handleArchiveCurrentVersion}
              disabled={sm.isArchivingVersion}
              title="Hide from your working drafts. Does not change what students see."
            >
              {sm.isArchivingVersion ? "Moving…" : "Move to archive"}
            </button>
          )}

          {(sm.displayedVersionSummary?.lineage_chain.length ?? 0) > 0 && (
            <VersionLineageInfo
              lineageChain={sm.displayedVersionSummary?.lineage_chain ?? []}
              onSelectVersion={sm.handleSelectVersion}
            />
          )}

          <div className="sm-version-bar__spacer" />

          <div className="sm-version-bar__reading-actions">
            <button
              type="button"
              className="sm-mentor-btn sm-mentor-btn--ghost sm-version-bar__focus-btn"
              onClick={() => void sm.handleDownloadDisplayedVersionPdf()}
              disabled={sm.isDownloadingPdf || !sm.displayedVersionId || !sm.studyMaterialContent}
              title="Download the version you are viewing as a PDF"
            >
              <Download size={14} aria-hidden />
              {sm.isDownloadingPdf ? "Preparing PDF…" : "Download PDF"}
            </button>
            <button
              type="button"
              className="sm-mentor-btn sm-mentor-btn--ghost sm-version-bar__focus-btn"
              onClick={onOpenFocusView}
              title="Open study material in a focused reading view"
            >
              <Maximize2 size={14} aria-hidden />
              Reading view
            </button>
          </div>
        </div>
      )}

      <div className="sm-mentor-workspace">
        <div className="sm-mentor-workspace__paper">
          <StudyMaterialViewer
            nodeId={node.node_id}
            content={sm.studyMaterialContent!}
            referenceMaterialId={
              sm.activeVersion?.reference_material_id ?? sm.referenceMaterial?.material_id ?? null
            }
            referenceImagesRefreshKey={
              sm.viewingVersionId ?? sm.activeVersion?.version_id ?? sm.studyMaterialContent
            }
            documentLayout
            hideHeader
          />
        </div>

        {showQcWarning && sm.activeVersion ? (
          <StudyMaterialQcWarningPanel
            activeVersion={sm.activeVersion}
            onAcceptDraft={sm.handleAcceptFailedQc}
            onDiscardDrafts={() => sm.setShowDeleteDraftModal(true)}
          />
        ) : (
          <StudyMaterialVersionPanel
            versions={sm.showArchivedPanel ? sm.archivedVersionHistory : sm.versionHistory}
            activeVersionId={sm.mentorUiState?.active_version_id ?? sm.activeVersion?.version_id ?? null}
            viewingVersionId={sm.viewingVersionId}
            isLoading={sm.isLoadingVersions}
            isUnarchiving={sm.isUnarchivingVersion}
            mode={sm.showArchivedPanel ? "archived" : "active"}
            studentArchiveExpanded={sm.studentArchiveExpanded}
            onStudentArchiveExpandedChange={sm.setStudentArchiveExpanded}
            focusStudentArchiveNonce={sm.focusStudentArchiveNonce}
            onSelectVersion={sm.handleSelectVersion}
            onUnarchiveVersion={sm.handleUnarchiveVersion}
          >
            <div className="study-material-version-panel__quiz-cta">
              <button
                type="button"
                className="sm-mentor-btn sm-mentor-btn--primary sm-mentor-btn--block"
                disabled={!sm.canAccessQuiz}
                title={
                  !sm.canAccessQuiz
                    ? spaceIsPublished === false
                      ? "Publish the space to access Quiz"
                      : "Generate study material to enable quiz generation"
                    : undefined
                }
                onClick={() => {
                  if (sm.canAccessQuiz) sm.setCurrentPage(3);
                }}
              >
                <Zap size={14} aria-hidden />
                {qz.quizDraftExists ? "View Quiz Draft" : "Proceed to Quiz Generation"}
              </button>
            </div>
          </StudyMaterialVersionPanel>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialMentorWorkspace;
