import React, { useState } from "react";
import {
  ChevronDown,
  FileClock,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { UseQuizReturn } from "../hooks/useQuiz";
import type { TopicContentPage } from "../../spaces/types/node.types";

type ReviewToolbarTab = "edit" | "view";

interface HintReviewToolbarProps {
  qz: UseQuizReturn;
  onPageChange: (page: TopicContentPage) => void;
  hintsNone: boolean;
  onGenerateAllHints: () => void;
  onRegenerateAllHints: () => void;
}

const HintReviewToolbar: React.FC<HintReviewToolbarProps> = ({
  qz,
  onPageChange,
  hintsNone,
  onGenerateAllHints,
  onRegenerateAllHints,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewToolbarTab>("edit");
  const [isExpanded, setIsExpanded] = useState(true);
  const quiz = qz.quiz;

  if (!quiz) return null;

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
    document.getElementById(`hint-${nextTab}-tab`)?.focus();
  };

  return (
    <section className="sm-review-toolbar" aria-label="Hint review toolbar">
      <div className="sm-review-toolbar__tabs-row">
        <div className="sm-review-toolbar__tabs" role="tablist" aria-label="Hint tools">
          <button
            type="button"
            role="tab"
            id="hint-edit-tab"
            aria-controls="hint-toolbar-panel"
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
            id="hint-view-tab"
            aria-controls="hint-toolbar-panel"
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
          aria-controls="hint-toolbar-panel"
          title={isExpanded ? "Collapse hints toolbar" : "Expand hints toolbar"}
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
          id="hint-toolbar-panel"
          role="tabpanel"
          aria-labelledby={`hint-${activeTab}-tab`}
          className="sm-review-toolbar__panel"
        >
          {activeTab === "edit" ? (
            <div className="sm-review-toolbar__action-group">
              {hintsNone ? (
                <button
                  type="button"
                  className="sm-review-toolbar__action"
                  onClick={onGenerateAllHints}
                  disabled={qz.isGeneratingHints || !qz.canGenerateHints}
                  title={!qz.canGenerateHints ? (qz.hintsLockedTooltip ?? undefined) : undefined}
                >
                  <Sparkles size={18} aria-hidden />
                  <span>{qz.isGeneratingHints ? "Generating hints…" : "Generate all hints"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="sm-review-toolbar__action"
                  onClick={onRegenerateAllHints}
                  disabled={qz.isGeneratingHints || !qz.canRegenerateHints}
                  title={!qz.canRegenerateHints ? (qz.hintsLockedTooltip ?? undefined) : undefined}
                >
                  <RefreshCw size={18} aria-hidden />
                  <span>{qz.isGeneratingHints ? "Generating…" : "Regenerate all"}</span>
                </button>
              )}
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={() => onPageChange(3)}
              >
                <FileClock size={18} aria-hidden />
                <span>Question review</span>
              </button>
            </div>
          ) : (
            <div className="sm-review-toolbar__action-group">
              <button
                type="button"
                className="sm-review-toolbar__action sm-review-toolbar__action--danger"
                onClick={() => qz.setShowDeleteHintsModal(true)}
                disabled={quiz.is_published || hintsNone || qz.isDeletingHintsDraft}
                title={
                  quiz.is_published
                    ? "Remove the quiz from students before deleting hints"
                    : hintsNone
                      ? "No hints have been generated yet"
                      : undefined
                }
              >
                <Trash2 size={18} aria-hidden />
                <span>Delete draft</span>
              </button>
              {quiz.is_published && (
                <button
                  type="button"
                  className="sm-review-toolbar__action"
                  onClick={() => void qz.handleUnpublishQuiz()}
                  disabled={qz.isUnpublishing}
                >
                  <FileClock size={18} aria-hidden />
                  <span>{qz.isUnpublishing ? "Removing…" : qz.unpublishQuizButtonLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default HintReviewToolbar;
