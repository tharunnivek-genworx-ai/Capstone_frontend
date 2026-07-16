import React, { useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  FileClock,
  ListPlus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { UseQuizReturn } from "../hooks/useQuiz";

type ReviewToolbarTab = "edit" | "view";

interface QuizReviewToolbarProps {
  qz: UseQuizReturn;
  showAnswerKey: boolean;
  onToggleAnswerKey: () => void;
  onAddQuestion: () => void;
  onProceedToHints: () => void;
  canAddQuestion: boolean;
  activeQuestionsCount: number;
}

const QuizReviewToolbar: React.FC<QuizReviewToolbarProps> = ({
  qz,
  showAnswerKey,
  onToggleAnswerKey,
  onAddQuestion,
  onProceedToHints,
  canAddQuestion,
  activeQuestionsCount,
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
    document.getElementById(`quiz-${nextTab}-tab`)?.focus();
  };

  return (
    <section className="sm-review-toolbar" aria-label="Quiz review toolbar">
      <div className="sm-review-toolbar__tabs-row">
        <div className="sm-review-toolbar__tabs" role="tablist" aria-label="Quiz tools">
          <button
            type="button"
            role="tab"
            id="quiz-edit-tab"
            aria-controls="quiz-toolbar-panel"
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
            id="quiz-view-tab"
            aria-controls="quiz-toolbar-panel"
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
          aria-controls="quiz-toolbar-panel"
          title={isExpanded ? "Collapse quiz toolbar" : "Expand quiz toolbar"}
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
          id="quiz-toolbar-panel"
          role="tabpanel"
          aria-labelledby={`quiz-${activeTab}-tab`}
          className="sm-review-toolbar__panel"
        >
          {activeTab === "edit" ? (
            <div className="sm-review-toolbar__action-group">
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={() => {
                  if (qz.showUpdateQuizNudge) {
                    void qz.handleGenerate();
                  } else {
                    qz.setShowRegenerateModal(true);
                  }
                }}
                disabled={
                  quiz.is_published
                  || qz.isGenerating
                  || (qz.showUpdateQuizNudge ? !qz.canGenerateQuiz : !qz.canRegenerateQuiz)
                }
                title={
                  quiz.is_published
                    ? "Remove the quiz from students before regenerating"
                    : undefined
                }
              >
                {qz.showUpdateQuizNudge ? <Sparkles size={18} aria-hidden /> : <RefreshCw size={18} aria-hidden />}
                <span>{qz.showUpdateQuizNudge ? "Regenerate for new SM" : "Regenerate"}</span>
              </button>
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={onAddQuestion}
                disabled={!canAddQuestion}
                title={!canAddQuestion ? "Published quizzes cannot be edited" : undefined}
              >
                <ListPlus size={18} aria-hidden />
                <span>Add question</span>
              </button>
              {!quiz.is_published && (
                <button
                  type="button"
                  className="sm-review-toolbar__action"
                  onClick={onProceedToHints}
                  disabled={qz.isGenerating || activeQuestionsCount === 0}
                  title="Proceed to hint generation"
                >
                  <Sparkles size={18} aria-hidden />
                  <span>Hints</span>
                </button>
              )}
            </div>
          ) : (
            <div className="sm-review-toolbar__action-group">
              <button
                type="button"
                className="sm-review-toolbar__action"
                onClick={onToggleAnswerKey}
                aria-pressed={showAnswerKey}
              >
                {showAnswerKey ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                <span>{showAnswerKey ? "Hide answer key" : "Show answer key"}</span>
              </button>
              <span className="sm-review-toolbar__separator" aria-hidden />
              <button
                type="button"
                className="sm-review-toolbar__action sm-review-toolbar__action--danger"
                onClick={() => qz.setShowDeleteDraftModal(true)}
                disabled={quiz.is_published || qz.isDeletingDraft}
                title={quiz.is_published ? "Remove the quiz from students before deleting the draft" : undefined}
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

export default QuizReviewToolbar;
