// src/features/quiz/components/QuizPage4.tsx
import React, { useState } from "react";
import type { UseQuizReturn } from "../hooks/useQuiz";
import type { TopicContentPage } from "../../spaces/types/node.types";
import HintCard from "./HintCard";
import HintRegenerateModal from "./HintRegenerateModal";
import HintRegenerateAllModal from "./HintRegenerateAllModal";
import HintDeleteDraftModal from "./HintDeleteDraftModal";
import QuizPublishConfirmModal from "./QuizPublishConfirmModal";
import QuizUnpublishConfirmModal from "./QuizUnpublishConfirmModal";
import HintGenerationDiagnosticsPanel from "./HintGenerationDiagnosticsPanel";
import QuizMentorVisibilityBanner from "./QuizMentorVisibilityBanner";
import HintReviewToolbar from "./HintReviewToolbar";
import QuizPassThresholdControl from "./QuizPassThresholdControl";
import GenerationProgressPanel from "../../generation/components/GenerationProgressPanel";
import { useGenerationProgress } from "../../generation/hooks/useGenerationProgress";
import { useGenerationRunResume } from "../../generation/hooks/useGenerationRunResume";
import type { MentorStudentVisibilityOut } from "../../study_material/types/studyMaterial.types";
import "../../study_material/styles/studyMaterialMentor.css";
import "../styles/mentorQuiz.css";

interface QuizPage4Props {
  qz: UseQuizReturn;
  onPageChange: (page: TopicContentPage) => void;
  studentVisibility?: MentorStudentVisibilityOut | null;
}

const QuizPage4: React.FC<QuizPage4Props> = ({
  qz,
  onPageChange,
  studentVisibility = null,
}) => {
  const [hintRegenerateTarget, setHintRegenerateTarget] = useState<{
    questionId: string;
    questionIndex: number;
    questionText: string;
  } | null>(null);
  const [showRegenerateAllHintsModal, setShowRegenerateAllHintsModal] = useState(false);
  const showHintGenerationUi =
    qz.isGeneratingHints ||
    qz.isPausingGeneration ||
    (qz.generationRunPaused && qz.failedGenerationPipeline === "hint") ||
    (qz.generationRunFailed && qz.failedGenerationPipeline === "hint");
  const hintGenerationProgress = useGenerationProgress(
    qz.generationProgressSessionId,
    showHintGenerationUi,
    qz.isGeneratingHints || qz.isResumingFailedGeneration,
    qz.activeGenerationRunId ?? qz.generationProgressSessionId,
    qz.generationProgress,
  );
  const hintRunResume = useGenerationRunResume(
    qz.failedGenerationPipeline === "hint"
      ? qz.activeGenerationRunId
      : null,
  );

  if (qz.isLoadingQuiz || (qz.isViewingHistoryQuiz && qz.isLoadingHistoryQuiz)) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (showHintGenerationUi) {
    return (
      <GenerationProgressPanel
        title="Generating hints"
        subtitle={
          qz.isGeneratingHints && !qz.generationRunFailed
            ? (qz.quiz ? "The AI is updating hints for your quiz questions." : "The AI is writing hints for your quiz questions. This may take a minute.")
            : "Hint generation failed. You can resume from the last saved checkpoint."
        }
        progress={hintGenerationProgress}
        failedRunId={qz.generationRunFailed ? qz.activeGenerationRunId : null}
        pausedRunId={qz.generationRunPaused ? qz.activeGenerationRunId : null}
        resumable={hintRunResume.resumable}
        secondsUntilRetry={hintRunResume.secondsUntilRetry}
        isResuming={qz.isResumingFailedGeneration}
        isPausing={qz.isPausingGeneration}
        isAbandoning={qz.isAbandoningGeneration}
        canPause={hintRunResume.canPause || qz.isGeneratingHints}
        pauseContext={hintRunResume.pauseContext}
        onPause={qz.handlePauseGeneration}
        onResume={qz.handleResumeFailedGeneration}
        onAbandon={qz.handleAbandonGeneration}
      />
    );
  }

  const quiz = qz.quiz;
  if (!quiz) {
    return (
      <div style={{ flex: 1, borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No quiz found. Go back to page 3 to generate a quiz.</p>
      </div>
    );
  }

  const activeQuestions = quiz.questions
    .filter((q) => q.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  const hintsComplete = quiz.hints_status === "complete";
  const hintsNone = quiz.hints_status === "none";
  const hintsPartial = quiz.hints_status === "partial";
  const questionsWithCompleteHints = activeQuestions.filter(
    (question) => question.hint_1 && question.hint_2 && question.hint_3,
  ).length;
  const hintGeneration = quiz.qc_result?.hintGeneration;
  const questionsById = new Map(
    activeQuestions.map((question, index) => [
      question.question_id,
      { index, text: question.question_text },
    ]),
  );

  const handleScrollToQuestion = (questionId: string) => {
    onPageChange(3);
    const revealQuestion = (attempt = 0) => {
      const el = document.getElementById(`quiz-question-${questionId}`);
      if (el) {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        el.style.outline = "2px solid var(--as-primary, var(--color-primary))";
        el.style.outlineOffset = "3px";
        setTimeout(() => {
          el.style.outline = "";
          el.style.outlineOffset = "";
        }, 2000);
        return;
      }
      if (attempt < 20) {
        setTimeout(() => revealQuestion(attempt + 1), 100);
      }
    };
    requestAnimationFrame(() => revealQuestion());
  };

  const hintsStatusLabel = hintsComplete ? "Complete" : hintsPartial ? "Partial" : "None";
  const publishReady = quiz.is_published || qz.canPublishQuiz;

  return (
    <div className="quiz-hints-page">
      <div className="quiz-page__mentor-layout">
        <QuizMentorVisibilityBanner
          visibility={studentVisibility}
          statusTag={{
            label: hintsComplete ? "Complete" : hintsPartial ? "Partial" : "None",
            modifier: hintsComplete ? "live" : hintsPartial ? "draft" : "muted",
          }}
          metaText={`${questionsWithCompleteHints} of ${activeQuestions.length} hint sets · ${activeQuestions.length} questions`}
          secondaryInfoLabel="Hint workspace"
          secondaryInfoValue="Review progressive hints and publishing status here"
          actionLabel={
            quiz.is_published
              ? undefined
              : qz.isPublishing
                ? "Making live…"
                : qz.publishQuizButtonLabel
          }
          actionDisabled={!quiz.is_published && (!qz.canPublishQuiz || qz.isPublishing)}
          actionTitle={!qz.canPublishQuiz ? qz.publishDisabledTooltip ?? undefined : undefined}
          onAction={quiz.is_published ? undefined : qz.handlePublishQuiz}
          extraActions={
            quiz.is_published ? (
              <button
                type="button"
                className="sm-mentor-btn sm-mentor-btn--outline sm-mentor-btn--danger student-visibility-banner__action"
                onClick={() => void qz.handleUnpublishQuiz()}
                disabled={qz.isUnpublishing}
              >
                {qz.isUnpublishing ? "Removing…" : qz.unpublishQuizButtonLabel}
              </button>
            ) : undefined
          }
        />

        <HintReviewToolbar
          qz={qz}
          onPageChange={onPageChange}
          hintsNone={hintsNone}
          onGenerateAllHints={qz.handleGenerateHints}
          onRegenerateAllHints={() => setShowRegenerateAllHintsModal(true)}
        />

        <div className="sm-version-bar">
          <span className="sm-version-pill">
            Hints
            <span className={`sm-version-tag sm-version-tag--${quiz.is_published ? "live" : "draft"}`}>
              {quiz.is_published ? "Live for students" : "Working draft"}
            </span>
          </span>
          <span
            className={`quiz-status-chip ${
              hintsComplete
                ? "quiz-status-chip--complete"
                : hintsPartial
                  ? "quiz-status-chip--partial"
                  : "quiz-status-chip--empty"
            }`}
          >
            Hints: {hintsStatusLabel}
          </span>
          <span className="quiz-hints-version-bar__publish">
            Publishing: {quiz.is_published ? "Live" : publishReady ? "Ready" : "Waiting for complete hints"}
          </span>
          <QuizPassThresholdControl
            value={quiz.pass_threshold_percent}
            isSaving={qz.isUpdatingPassThreshold}
            onSave={qz.updatePassThreshold}
          />
        </div>

        {hintGeneration && (
          <HintGenerationDiagnosticsPanel
            hintGeneration={hintGeneration}
            entityNextLlmRetryAt={quiz.next_llm_retry_at}
            questionsById={questionsById}
            onNavigateQuestion={handleScrollToQuestion}
          />
        )}

        <div className="quiz-hints-scroll">
        {activeQuestions.length === 0 ? (
          <div className="quiz-empty-state">
            <strong>No questions yet</strong>
            <p>
              Return to <button type="button" className="quiz-hint-card__question-link" onClick={() => onPageChange(3)}>question review</button> to add questions first.
            </p>
          </div>
        ) : (
          activeQuestions.map((q, idx) => (
            <HintCard
              key={q.question_id}
              question={q}
              questionIndex={idx}
              isPublished={quiz.is_published}
              canEdit={qz.canEditQuestions}
              isRegeneratingHints={qz.isGeneratingHints}
              hintsStale={qz.hintsStaleQuestionIds.includes(q.question_id)}
              onRequestRegenerateHints={(questionId) => {
                setHintRegenerateTarget({
                  questionId,
                  questionIndex: idx,
                  questionText: q.question_text,
                });
              }}
              onScrollToQuestion={handleScrollToQuestion}
            />
          ))
        )}
        </div>
      </div>

      {showRegenerateAllHintsModal && (
        <HintRegenerateAllModal
          questionCount={activeQuestions.length}
          isSubmitting={qz.isGeneratingHints}
          onClose={() => !qz.isGeneratingHints && setShowRegenerateAllHintsModal(false)}
          onConfirm={async (feedback) => {
            const succeeded = await qz.handleRegenerateAllHints(feedback);
            if (succeeded) setShowRegenerateAllHintsModal(false);
          }}
        />
      )}

      {hintRegenerateTarget && (
        <HintRegenerateModal
          questionIndex={hintRegenerateTarget.questionIndex}
          questionText={hintRegenerateTarget.questionText}
          isSubmitting={qz.isGeneratingHints}
          onClose={() => !qz.isGeneratingHints && setHintRegenerateTarget(null)}
          onConfirm={async (feedback) => {
            const succeeded = await qz.handleRegenerateHints(hintRegenerateTarget.questionId, feedback);
            if (succeeded) setHintRegenerateTarget(null);
          }}
        />
      )}

      {qz.showPublishConfirmModal && (
        <QuizPublishConfirmModal
          quizTitle={quiz.title}
          otherLiveQuizTitle={qz.otherLiveQuizTitle}
          initialPassThresholdPercent={quiz.pass_threshold_percent}
          isSubmitting={qz.isPublishing}
          onClose={() => !qz.isPublishing && qz.setShowPublishConfirmModal(false)}
          onConfirm={(threshold) => void qz.confirmPublishQuiz(threshold)}
        />
      )}

      {qz.quizUnpublishPreview && (
        <QuizUnpublishConfirmModal
          preview={qz.quizUnpublishPreview}
          isSubmitting={qz.isUnpublishing}
          onClose={qz.closeUnpublishQuizModal}
          onConfirm={(mode) => void qz.confirmUnpublishQuiz(mode)}
        />
      )}

      {qz.showDeleteHintsModal && (
        <HintDeleteDraftModal
          isSubmitting={qz.isDeletingHintsDraft}
          onClose={() => !qz.isDeletingHintsDraft && qz.setShowDeleteHintsModal(false)}
          onConfirm={qz.handleDeleteHintsDraft}
        />
      )}
    </div>
  );
};

export default QuizPage4;
