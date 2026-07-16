import React, { useState } from "react";
import {
  Archive,
  ChevronDown,
  Download,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";

type ReviewToolbarTab = "edit" | "view";

interface StudyMaterialReviewToolbarProps {
  sm: UseStudyMaterialReturn;
  renderGenerationSourceButton: (className?: string) => React.ReactNode;
  renderTopicResourcesButton: (className?: string) => React.ReactNode;
}

const StudyMaterialReviewToolbar: React.FC<StudyMaterialReviewToolbarProps> = ({
  sm,
  renderGenerationSourceButton,
  renderTopicResourcesButton,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewToolbarTab>("edit");
  const [isExpanded, setIsExpanded] = useState(true);

  const improveTitle = sm.sourcePdfDeleted
    ? sm.sourcePdfDeletedBlockReason
    : sm.canEditActiveDraft
      ? undefined
      : "Return to the active draft to improve it";
  const regenerateTitle = sm.sourcePdfDeleted
    ? sm.sourcePdfDeletedBlockReason
    : sm.canEditActiveDraft
      ? undefined
      : sm.isViewingNonActiveVersion
        ? "Return to the active draft to regenerate"
        : "Set this version as your working draft to regenerate it";

  const selectTab = (tab: ReviewToolbarTab) => {
    setActiveTab(tab);
    setIsExpanded(true);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextTab =
      event.key === "ArrowLeft" || event.key === "Home" ? "edit" : "view";
    selectTab(nextTab);
    document.getElementById(`study-material-${nextTab}-tab`)?.focus();
  };

  return (
    <section className="sm-review-toolbar" aria-label="Document review toolbar">
      <div className="sm-review-toolbar__tabs-row">
        <div className="sm-review-toolbar__tabs" role="tablist" aria-label="Material tools">
          <button
            type="button"
            role="tab"
            id="study-material-edit-tab"
            aria-controls="study-material-toolbar-panel"
            aria-selected={activeTab === "edit"}
            className="sm-review-toolbar__tab"
            onClick={() => selectTab("edit")}
            onKeyDown={handleTabKeyDown}
            tabIndex={activeTab === "edit" ? 0 : -1}
          >
            Edit
          </button>
          <button
            type="button"
            role="tab"
            id="study-material-view-tab"
            aria-controls="study-material-toolbar-panel"
            aria-selected={activeTab === "view"}
            className="sm-review-toolbar__tab"
            onClick={() => selectTab("view")}
            onKeyDown={handleTabKeyDown}
            tabIndex={activeTab === "view" ? 0 : -1}
          >
            View
          </button>
        </div>
        <button
          type="button"
          className="sm-review-toolbar__collapse"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          aria-controls="study-material-toolbar-panel"
          title={isExpanded ? "Collapse document toolbar" : "Expand document toolbar"}
        >
          <span>{isExpanded ? "Collapse toolbar" : "Expand toolbar"}</span>
          <ChevronDown
            size={18}
            aria-hidden
            className={isExpanded ? "sm-review-toolbar__chevron--open" : undefined}
          />
        </button>
      </div>

      {isExpanded && (
        <div
          id="study-material-toolbar-panel"
          role="tabpanel"
          aria-labelledby={`study-material-${activeTab}-tab`}
          className="sm-review-toolbar__panel"
        >
          {activeTab === "edit" ? (
            <div className="sm-review-toolbar__action-group">
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={() => sm.openFeedbackModal("improve")}
                disabled={!sm.canRegenerateOrImproveDraft}
                title={improveTitle}
              >
                <Sparkles size={18} aria-hidden />
                <span>Improve</span>
              </button>
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={() => sm.openFeedbackModal("regenerate")}
                disabled={!sm.canRegenerateOrImproveDraft}
                title={regenerateTitle}
              >
                <RefreshCw size={18} aria-hidden />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={() => sm.setIsManualEditMode(true)}
                disabled={!sm.canEditActiveDraft}
                title={sm.canEditActiveDraft ? undefined : "Return to the active draft to edit it"}
              >
                <Pencil size={18} aria-hidden />
                <span>Edit draft</span>
              </button>
              <span className="sm-review-toolbar__separator" aria-hidden />
              {Boolean(sm.activeVersion?.reference_material_id) &&
                renderGenerationSourceButton("sm-review-toolbar__action")}
              {renderTopicResourcesButton("sm-review-toolbar__action")}
            </div>
          ) : (
            <div className="sm-review-toolbar__action-group">
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={sm.handleArchiveCurrentVersion}
                disabled={!sm.canArchiveDisplayedVersion || sm.isArchivingVersion}
                title={
                  sm.canArchiveDisplayedVersion
                    ? "Move this draft to your archive without changing student visibility"
                    : "Only an unpublished workspace draft can be archived"
                }
              >
                <Archive size={18} aria-hidden />
                <span>{sm.isArchivingVersion ? "Archiving…" : "Archive draft"}</span>
              </button>
              <button
                type="button"
                className="sm-review-toolbar__action sm-review-toolbar__action--danger"
                onClick={() => sm.setShowDeleteDraftModal(true)}
                disabled={!sm.canClearAllDrafts || sm.isDeletingDrafts}
                title={
                  sm.canClearAllDrafts
                    ? "Discard unpublished drafts from your workspace"
                    : sm.clearDraftsBlockReason
                }
              >
                <Trash2 size={18} aria-hidden />
                <span>Discard drafts</span>
              </button>
              <span className="sm-review-toolbar__separator" aria-hidden />
              {renderTopicResourcesButton("sm-review-toolbar__action")}
              <button
                type="button"
                className={`sm-review-toolbar__action${
                  sm.showArchivedPanel ? " sm-review-toolbar__action--active" : ""
                }`}
                onClick={() => sm.setShowArchivedPanel(true)}
                aria-pressed={sm.showArchivedPanel}
              >
                <Archive size={18} aria-hidden />
                <span>View archive</span>
                {sm.archivedVersionHistory.length > 0 && (
                  <span className="sm-review-toolbar__count">
                    {sm.archivedVersionHistory.length}
                  </span>
                )}
              </button>
              <span className="sm-review-toolbar__separator" aria-hidden />
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={() => void sm.handleDownloadDisplayedVersionPdf()}
                disabled={sm.isDownloadingPdf || !sm.displayedVersionId || !sm.studyMaterialContent}
              >
                <Download size={18} aria-hidden />
                <span>{sm.isDownloadingPdf ? "Preparing…" : "Download PDF"}</span>
              </button>
            </div>
          )}

        </div>
      )}
    </section>
  );
};

export default StudyMaterialReviewToolbar;
