import React, { useEffect, useState } from "react";
import { Maximize2, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";
import StudyMaterialViewer from "./StudyMaterialViewer";
import StudyMaterialHistoryHub from "./StudyMaterialHistoryHub";
import StudentVisibilityBanner from "./StudentVisibilityBanner";
import StudyMaterialVersionPanel from "../version/StudyMaterialVersionPanel";
import StudyMaterialQcWarningPanel from "../shared/StudyMaterialQcWarningPanel";
import { shouldShowQcWarning } from "../../utils/qcDisplayUtils";
import VersionLineageInfo from "../version/VersionLineageInfo";
import StudyMaterialReviewToolbar from "./StudyMaterialReviewToolbar";
import "../../styles/studyMaterialMentor.css";

interface StudyMaterialMentorWorkspaceProps {
  node: NodeTreeNode;
  sm: UseStudyMaterialReturn;
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
  onOpenFocusView,
  renderGenerationSourceButton,
  renderTopicResourcesButton,
}) => {
  const [isVersionSidebarOpen, setIsVersionSidebarOpen] = useState(true);

  useEffect(() => {
    if (sm.focusStudentArchiveNonce > 0) {
      setIsVersionSidebarOpen(true);
    }
  }, [sm.focusStudentArchiveNonce]);

  const showQcWarning =
    sm.isDisplayedActiveWorkingDraft &&
    shouldShowQcWarning(
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

      <StudyMaterialReviewToolbar
        sm={sm}
        renderGenerationSourceButton={renderGenerationSourceButton}
        renderTopicResourcesButton={renderTopicResourcesButton}
      />

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

      {sm.showExternalResearchFailSoftBanner && (
        <div
          className="study-material-external-research-fail-soft-banner"
          role="status"
        >
          <span>{sm.externalResearchFailSoftMessage}</span>
          <button
            type="button"
            className="study-material-external-research-fail-soft-banner__dismiss"
            onClick={sm.dismissExternalResearchFailSoftBanner}
            aria-label="Dismiss warning"
          >
            Dismiss
          </button>
        </div>
      )}

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

          {(sm.displayedVersionSummary?.lineage_chain.length ?? 0) > 0 && (
            <VersionLineageInfo
              lineageChain={sm.displayedVersionSummary?.lineage_chain ?? []}
              onSelectVersion={sm.handleSelectVersion}
            />
          )}

        </div>
      )}

      <div
        className={`sm-mentor-workspace${
          isVersionSidebarOpen ? "" : " sm-mentor-workspace--sidebar-collapsed"
        }`}
      >
        <div className="sm-mentor-workspace__paper">
          <button
            type="button"
            className="sm-mentor-workspace__fullscreen-button"
            onClick={onOpenFocusView}
            aria-label="Open study material in full screen"
            title="Open full-screen reading view"
          >
            <Maximize2 size={19} aria-hidden="true" />
          </button>
          <StudyMaterialViewer
            nodeId={node.node_id}
            content={sm.studyMaterialContent!}
            referenceMaterialId={
              sm.displayedVersionSummary?.reference_material_id ??
              sm.activeVersion?.reference_material_id ??
              sm.referenceMaterial?.material_id ??
              null
            }
            referenceImagesRefreshKey={
              sm.viewingVersionId ?? sm.activeVersion?.version_id ?? sm.studyMaterialContent
            }
            documentLayout
            hideHeader
          />
        </div>

        <aside className="sm-mentor-workspace__sidebar" aria-label="Version history">
          <button
            type="button"
            className="sm-mentor-workspace__sidebar-toggle"
            onClick={() => setIsVersionSidebarOpen((open) => !open)}
            aria-expanded={isVersionSidebarOpen}
            title={isVersionSidebarOpen ? "Hide version history" : "Show version history"}
          >
            {isVersionSidebarOpen ? (
              <>
                <PanelRightClose size={16} aria-hidden />
                Hide history
              </>
            ) : (
              <>
                <PanelRightOpen size={16} aria-hidden />
                Version history
              </>
            )}
          </button>
          {showQcWarning && sm.activeVersion && (
            <StudyMaterialQcWarningPanel
              activeVersion={sm.activeVersion}
              onAcceptDraft={sm.handleAcceptFailedQc}
              onDiscardDrafts={() => sm.setShowDeleteDraftModal(true)}
              canDiscardDrafts={sm.canClearAllDrafts && !sm.isDeletingDrafts}
              discardBlockReason={sm.clearDraftsBlockReason}
            />
          )}
          <div className="sm-mentor-workspace__sidebar-panel">
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
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudyMaterialMentorWorkspace;
