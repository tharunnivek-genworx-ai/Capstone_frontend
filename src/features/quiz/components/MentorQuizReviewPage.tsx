// src/features/quiz/components/MentorQuizReviewPage.tsx
import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { UseQuizReturn } from "../hooks/useQuiz";
import type { QuizDifficulty, QuizQuestionCreateRequest, QuizQuestionUpdateRequest } from "../types/quiz.types";
import QuizQuestionCard from "./QuizQuestionCard";
import QuizAnswerKeyPanel from "./QuizAnswerKeyPanel";
import QuizRegenerateModal from "./QuizRegenerateModal";
import QuizDeleteDraftModal from "./QuizDeleteDraftModal";
import QuizPublishConfirmModal from "./QuizPublishConfirmModal";
import QuizUnpublishConfirmModal from "./QuizUnpublishConfirmModal";
import QuizQuestionModal from "./QuizQuestionModal";
import QuizHistoryPanel from "./QuizHistoryPanel";
import QuizQcWarningPanel from "./QuizQcWarningPanel";
import QuizMentorVisibilityBanner from "./QuizMentorVisibilityBanner";
import QuizReviewToolbar from "./QuizReviewToolbar";
import QuizPassThresholdControl from "./QuizPassThresholdControl";
import { isLlmRateLimited } from "../../study_material/utils/llmDiagnostics";
import { shouldShowQcWarning } from "../../study_material/utils/qcDisplayUtils";
import type { MentorStudentVisibilityOut } from "../../study_material/types/studyMaterial.types";
import GenerationProgressPanel from "../../generation/components/GenerationProgressPanel";
import { useGenerationProgress } from "../../generation/hooks/useGenerationProgress";
import { useGenerationRunResume } from "../../generation/hooks/useGenerationRunResume";
import "../../study_material/styles/studyMaterialMentor.css";
import "../styles/mentorQuiz.css";

interface MentorQuizReviewPageProps {
  nodeTitle: string;
  qz: UseQuizReturn;
  studentVisibility?: MentorStudentVisibilityOut | null;
}

const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const MentorQuizReviewPage: React.FC<MentorQuizReviewPageProps> = ({
  nodeTitle,
  qz,
  studentVisibility = null,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [localQuestionIds, setLocalQuestionIds] = useState<string[] | null>(null);
  const [questionCountInput, setQuestionCountInput] = useState(String(qz.questionCount));
  useEffect(() => {
    setQuestionCountInput(String(qz.questionCount));
  }, [qz.questionCount]);
  const showQuizGenerationUi =
    qz.isGenerating ||
    qz.isPausingGeneration ||
    Boolean(qz.isRegeneratingQuestion) ||
    (qz.generationRunPaused && qz.failedGenerationPipeline === "quiz") ||
    (qz.generationRunFailed && qz.failedGenerationPipeline === "quiz");
  const generationProgress = useGenerationProgress(
    qz.generationProgressSessionId,
    showQuizGenerationUi,
    qz.isGenerating || qz.isResumingFailedGeneration || Boolean(qz.isRegeneratingQuestion),
    qz.activeGenerationRunId ?? qz.generationProgressSessionId,
    qz.generationProgress,
  );
  const quizRunResume = useGenerationRunResume(
    qz.failedGenerationPipeline === "quiz"
      ? qz.activeGenerationRunId
      : null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeQuestions = (qz.quiz?.questions ?? []).filter((q) => q.is_active);
  const sortedQuestions = localQuestionIds
    ? localQuestionIds
        .map((id) => activeQuestions.find((q) => q.question_id === id))
        .filter(Boolean) as typeof activeQuestions
    : [...activeQuestions].sort((a, b) => a.order_index - b.order_index);

  const allQuestionsForDisplay = localQuestionIds
    ? [
        ...sortedQuestions,
        ...(qz.quiz?.questions ?? []).filter((q) => !q.is_active),
      ]
    : [
        ...[...activeQuestions].sort((a, b) => a.order_index - b.order_index),
        ...(qz.quiz?.questions ?? []).filter((q) => !q.is_active),
      ];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = sortedQuestions.map((q) => q.question_id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(currentIds, oldIndex, newIndex);
    setLocalQuestionIds(newOrder);
    await qz.handleReorderQuestions(newOrder);
    setLocalQuestionIds(null);
  };

  const handleCreateQuestion = async (data: QuizQuestionCreateRequest | QuizQuestionUpdateRequest) => {
    setIsSavingQuestion(true);
    try {
      const succeeded = await qz.handleCreateQuestion(data as QuizQuestionCreateRequest);
      if (succeeded) setShowAddModal(false);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const commitQuestionCountInput = () => {
    const parsed = Number.parseInt(questionCountInput, 10);
    const clamped = Number.isFinite(parsed) ? Math.max(5, Math.min(20, parsed)) : qz.questionCount;
    qz.setQuestionCount(clamped);
    setQuestionCountInput(String(clamped));
    return clamped;
  };

  // ── Loading state (workspace quiz or history fetch) ─────────────────────
  if (qz.isLoadingQuiz || qz.isLoadingHistoryQuiz) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (showQuizGenerationUi) {
    const isQuestionRework = Boolean(qz.isRegeneratingQuestion) && !qz.generationRunFailed;
    return (
      <GenerationProgressPanel
        title={isQuestionRework ? "Regenerating question" : "Generating quiz"}
        subtitle={
          isQuestionRework
            ? `The AI is reworking a quiz question for "${nodeTitle}".`
            : `The AI is building quiz questions for "${nodeTitle}". This may take a minute.`
        }
        progress={generationProgress}
        failedRunId={qz.generationRunFailed ? qz.activeGenerationRunId : null}
        pausedRunId={qz.generationRunPaused ? qz.activeGenerationRunId : null}
        resumable={quizRunResume.resumable}
        secondsUntilRetry={quizRunResume.secondsUntilRetry}
        isResuming={qz.isResumingFailedGeneration}
        isPausing={qz.isPausingGeneration}
        isAbandoning={qz.isAbandoningGeneration}
        canPause={quizRunResume.canPause || qz.isGenerating || Boolean(qz.isRegeneratingQuestion)}
        pauseContext={quizRunResume.pauseContext}
        onPause={qz.handlePauseGeneration}
        onResume={qz.handleResumeFailedGeneration}
        onAbandon={qz.handleAbandonGeneration}
      />
    );
  }

  // ── History read-only view (before generate form — no workspace draft) ──
  if (qz.isViewingHistoryQuiz && qz.historyQuiz) {
    const historyQuiz = qz.historyQuiz;
    const historyItem = qz.viewingHistoryItem;
    const historyDifficulty =
      DIFFICULTY_OPTIONS.find((d) => d.value === historyQuiz.difficulty)?.label ??
      historyQuiz.difficulty;
    const historyQuestions = [...historyQuiz.questions]
      .filter((q) => q.is_active)
      .sort((a, b) => a.order_index - b.order_index);

    return (
      <div className="quiz-page quiz-page--history">
        <div className="quiz-page__mentor-layout">
        <div className="quiz-page__banner">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className="quiz-page__banner-title">Quiz history — read-only</span>
              {historyItem?.status_badge && (
                <span className="quiz-page__badge quiz-page__badge--draft">{historyItem.status_badge}</span>
              )}
            </div>
            <p className="quiz-page__banner-text">
              Viewing a previous version. Close to return to quiz generation.
              {historyItem?.can_delete ? " Removed quizzes can be deleted here." : ""}
            </p>
          </div>
          <div className="quiz-page__banner-actions">
            {historyItem?.can_delete && (
              <button
                type="button"
                className="quiz-danger-action"
                onClick={() => void qz.handleDeleteHistoryQuiz(historyQuiz.quiz_id)}
                disabled={qz.isDeletingDraft}
              >
                Delete
              </button>
            )}
            <button type="button" className="quiz-secondary-action" onClick={qz.handleCloseHistoryView}>
              Close
            </button>
          </div>
        </div>

        <div className="sm-version-bar">
          <span className="sm-version-pill">
            Quiz history
            {historyItem?.status_badge && (
              <span className="sm-version-tag sm-version-tag--muted">{historyItem.status_badge}</span>
            )}
          </span>
          <span className="quiz-mentor-visibility-banner__meta-text">
            {historyQuiz.total_questions} questions · {historyDifficulty}
            {historyItem?.version_label ? ` · ${historyItem.version_label}` : ""}
          </span>
        </div>

        <div className="quiz-page__scroll">
          <QuizAnswerKeyPanel questions={historyQuiz.questions} compact defaultCollapsed />
          {historyQuestions.map((q, index) => (
            <QuizQuestionCard
              key={q.question_id}
              question={q}
              index={index}
              isPublished
              canEdit={false}
              isSaving={false}
              isDeleting={false}
              isRegenerating={false}
              onUpdate={async () => false}
              onDelete={async () => false}
              onRegenerate={async () => false}
            />
          ))}
        </div>

        <QuizHistoryPanel
          history={qz.quizHistory}
          onView={(quizId) => void qz.handleViewHistoryQuiz(quizId)}
          onDelete={(quizId) => void qz.handleDeleteHistoryQuiz(quizId)}
          isDeleting={qz.isDeletingDraft}
          viewingQuizId={qz.viewingHistoryItem?.quiz_id ?? null}
        />
        </div>
      </div>
    );
  }

  // ── Generation form (no workspace quiz yet) ─────────────────────────────
  if (!qz.quiz) {
    return (
      <div className="quiz-page quiz-page--setup">
        <div className="quiz-page__mentor-layout">
        <div className="quiz-setup">
          <header className="quiz-page-heading">
            <span className="quiz-page-heading__eyebrow">Quiz studio</span>
            <h2>Create a knowledge check</h2>
            <p>
              Build multiple-choice questions from the current published study material for
              <strong> {nodeTitle}</strong>.
            </p>
          </header>

          <section className="quiz-setup-card" aria-labelledby="quiz-setup-title">
            <div className="quiz-setup-card__intro">
              <h3 id="quiz-setup-title">Quiz setup</h3>
              <p>Choose the size and challenge level. You can edit every question before publishing.</p>
            </div>

            <div className="quiz-setup-field">
              <label htmlFor="quiz-question-count">Number of questions</label>
              <div className="quiz-setup-field__count">
                <input
                  id="quiz-question-count"
                  type="number"
                  value={questionCountInput}
                  min={5}
                  max={20}
                  onChange={(e) => setQuestionCountInput(e.target.value)}
                  onBlur={commitQuestionCountInput}
                  aria-describedby="quiz-question-count-help"
                />
                <span id="quiz-question-count-help" className="quiz-setup-field__help">
                  5–20 questions
                </span>
              </div>
            </div>

            <fieldset className="quiz-setup-field" style={{ border: 0, padding: 0, marginInline: 0 }}>
              <legend>Difficulty</legend>
              <div className="quiz-difficulty-options">
                {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className="quiz-difficulty-option"
                    aria-pressed={qz.difficulty === value}
                    onClick={() => qz.setDifficulty(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="quiz-setup-context" role="note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              <div>
                <strong>Lesson context is included automatically</strong>
                Questions are grounded in the study material students can currently access.
              </div>
            </div>

            {!qz.canGenerateQuiz && qz.generateDisabledTooltip && (
              <div className="quiz-setup-context" role="status">
                <div>
                  <strong>Quiz generation is not ready</strong>
                  {qz.generateDisabledTooltip}
                </div>
              </div>
            )}

            <div className="quiz-setup-action">
              <p>Generation runs in the background and can be paused or resumed safely.</p>
              <button
                type="button"
                className="quiz-primary-action"
                onClick={() => {
                  const questionCount = commitQuestionCountInput();
                  void qz.handleGenerate(questionCount);
                }}
                disabled={qz.isGenerating || !qz.canGenerateQuiz}
                title={!qz.canGenerateQuiz ? qz.generateDisabledTooltip ?? undefined : undefined}
              >
                {qz.isGenerating ? (
                  <>
                    <span className="spinner" style={{ width: "1rem", height: "1rem" }} />
                    Generating quiz…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Generate quiz
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        <QuizHistoryPanel
          history={qz.quizHistory}
          onView={(quizId) => void qz.handleViewHistoryQuiz(quizId)}
          onDelete={(quizId) => void qz.handleDeleteHistoryQuiz(quizId)}
          isDeleting={qz.isDeletingDraft}
          viewingQuizId={qz.viewingHistoryItem?.quiz_id ?? null}
        />
        </div>
      </div>
    );
  }

  const quiz = qz.quiz!;
  const difficultyLabel = DIFFICULTY_OPTIONS.find((d) => d.value === quiz.difficulty)?.label ?? quiz.difficulty;
  const rateLimited = isLlmRateLimited(quiz.qc_result);

  const showQcWarning = shouldShowQcWarning(quiz.qc_failed_permanently, quiz.qc_result);

  const needsHintsBeforePublish = !quiz.is_published && quiz.hints_status !== "complete";
  const showCombinedHintsCta = needsHintsBeforePublish && activeQuestions.length > 0;
  const canAddQuestion = !qz.isGenerating && !quiz.is_published && !rateLimited && qz.canEditQuestions;

  const publishActionLabel = showCombinedHintsCta
    ? quiz.hints_status === "partial"
      ? "Continue generating hints…"
      : "Generate hints and then publish quiz"
    : qz.isPublishing
      ? "Making live…"
      : qz.publishQuizButtonLabel;

  return (
    <div className="quiz-page">
      <div className="quiz-page__mentor-layout">
        <QuizMentorVisibilityBanner
          visibility={studentVisibility}
          statusTag={{
            label: quiz.is_published ? "Live" : "Draft",
            modifier: quiz.is_published ? "live" : "draft",
          }}
          metaText={`${quiz.total_questions} questions · ${difficultyLabel}`}
          secondaryInfoLabel="Quiz workspace"
          secondaryInfoValue="Review questions, answers, and publishing status here"
          actionLabel={publishActionLabel}
          actionDisabled={
            showCombinedHintsCta
              ? qz.isGenerating
              : !qz.canPublishQuiz || qz.isPublishing || quiz.is_published
          }
          actionTitle={
            showCombinedHintsCta
              ? "Hints must be generated before the quiz can go live for students"
              : !qz.canPublishQuiz
                ? qz.publishDisabledTooltip ?? undefined
                : undefined
          }
          onAction={
            showCombinedHintsCta
              ? qz.handleProceedToHints
              : quiz.is_published
                ? undefined
                : qz.handlePublishQuiz
          }
          extraActions={
            quiz.is_published ? (
              <button
                type="button"
                className="sm-mentor-btn sm-mentor-btn--outline sm-mentor-btn--danger student-visibility-banner__action"
                onClick={() => void qz.handleUnpublishQuiz()}
                disabled={qz.isUnpublishing}
              >
                {qz.isUnpublishing ? "Removing…" : "Unpublish"}
              </button>
            ) : undefined
          }
        />

        <QuizReviewToolbar
          qz={qz}
          showAnswerKey={qz.showAnswerKey}
          onToggleAnswerKey={() => qz.setShowAnswerKey(!qz.showAnswerKey)}
          onAddQuestion={() => setShowAddModal(true)}
          onProceedToHints={qz.handleProceedToHints}
          canAddQuestion={canAddQuestion}
          activeQuestionsCount={activeQuestions.length}
        />

        <div className="sm-version-bar">
          <span className="sm-version-pill">
            Quiz
            <span className={`sm-version-tag sm-version-tag--${quiz.is_published ? "live" : "draft"}`}>
              {quiz.is_published ? "Live for students" : "Working draft"}
            </span>
          </span>
          <span
            className={`quiz-status-chip ${
              quiz.hints_status === "complete"
                ? "quiz-status-chip--complete"
                : quiz.hints_status === "partial"
                  ? "quiz-status-chip--partial"
                  : "quiz-status-chip--empty"
            }`}
          >
            Hints: {quiz.hints_status}
          </span>
          <QuizPassThresholdControl
            value={quiz.pass_threshold_percent}
            isSaving={qz.isUpdatingPassThreshold}
            onSave={qz.updatePassThreshold}
          />
        </div>

        {qz.showUpdateQuizNudge && (
          <div className="quiz-page__sm-update-nudge" role="status">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <strong>Study material was updated</strong>
              <p>
                {qz.quizSmVersionLabel
                  ? <>This quiz was generated for <strong>{qz.quizSmVersionLabel}</strong>. The study material has since been updated — consider regenerating the quiz so questions match the latest content.</>
                  : "The study material has been updated — consider regenerating the quiz so questions match the latest content."
                }
              </p>
            </div>
          </div>
        )}

        <div className="quiz-page__body-row">
          <div className="quiz-page__main">
            <div className="quiz-page__scroll">
            <div className="quiz-review-summary">
              <div>
                <strong>Review every question before moving to hints</strong>
                <span>Drag to reorder. Regenerating or editing a question can make its hints stale.</span>
              </div>
              <span className={`quiz-status-chip ${quiz.hints_status === "complete" ? "quiz-status-chip--complete" : quiz.hints_status === "partial" ? "quiz-status-chip--partial" : "quiz-status-chip--empty"}`}>
                Hints: {quiz.hints_status}
              </span>
            </div>
            {qz.showAnswerKey && <QuizAnswerKeyPanel questions={quiz.questions} compact />}

            {!qz.isGenerating && quiz.questions.length === 0 && rateLimited && (
              <div className="quiz-page__generation-placeholder">
                <h3 className="quiz-page__generation-placeholder-title">Generation unavailable</h3>
                <p className="quiz-page__generation-placeholder-body">
                  The quiz could not be generated because the AI service is temporarily unavailable.
                  Please try again after the rate limit clears.
                </p>
              </div>
            )}

            {!qz.isGenerating && quiz.questions.length === 0 && !rateLimited && (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: "0 0 0.375rem" }}>No questions yet</p>
                <p style={{ fontSize: "0.8125rem", margin: 0 }}>Add questions manually or regenerate.</p>
              </div>
            )}

            {!qz.isGenerating && quiz.questions.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedQuestions.map((q) => q.question_id)}
                  strategy={verticalListSortingStrategy}
                >
                  {allQuestionsForDisplay.map((q, displayIndex) => (
                    <QuizQuestionCard
                      key={q.question_id}
                      question={q}
                      index={displayIndex}
                      isPublished={quiz.is_published}
                      canEdit={qz.canEditQuestions}
                      isSaving={isSavingQuestion}
                      isDeleting={qz.isDeletingQuestion === q.question_id}
                      isRegenerating={qz.isRegeneratingQuestion === q.question_id}
                      hintsStale={qz.hintsStaleQuestionIds.includes(q.question_id)}
                      onUpdate={qz.handleUpdateQuestion}
                      onDelete={qz.handleDeleteQuestion}
                      onRegenerate={qz.handleRegenerateQuestion}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* Add question button */}
            {canAddQuestion && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="quiz-secondary-action quiz-add-question"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Question
              </button>
            )}
            </div>
          </div>

          {showQcWarning && (
            <QuizQcWarningPanel
              quiz={quiz}
              onAcceptDraft={() => void qz.handleAcceptFailedQc()}
              onDeleteDraft={() => qz.setShowDeleteDraftModal(true)}
            />
          )}
        </div>

        <QuizHistoryPanel
        history={qz.quizHistory}
        onView={(quizId) => void qz.handleViewHistoryQuiz(quizId)}
        onDelete={(quizId) => void qz.handleDeleteHistoryQuiz(quizId)}
        isDeleting={qz.isDeletingDraft}
        viewingQuizId={qz.viewingHistoryItem?.quiz_id ?? null}
        />
      </div>

      {/* Modals */}
      {qz.showRegenerateModal && (
        <QuizRegenerateModal
          nodeTitle={nodeTitle}
          quizTitle={quiz.title}
          hasGeneratedHints={quiz.hints_status !== "none"}
          isSubmitting={qz.isGenerating}
          questionCount={Math.max(activeQuestions.length, 5)}
          setQuestionCount={qz.setQuestionCount}
          difficulty={qz.difficulty}
          setDifficulty={qz.setDifficulty}
          onClose={() => !qz.isGenerating && qz.setShowRegenerateModal(false)}
          onConfirm={qz.handleRegenerate}
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

      {qz.showDeleteDraftModal && (
        <QuizDeleteDraftModal
          hasGeneratedHints={quiz.hints_status !== "none"}
          isSubmitting={qz.isDeletingDraft}
          onClose={() => !qz.isDeletingDraft && qz.setShowDeleteDraftModal(false)}
          onConfirm={qz.handleDeleteDraft}
        />
      )}

      {showAddModal && (
        <QuizQuestionModal
          mode="create"
          isSaving={isSavingQuestion}
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateQuestion}
        />
      )}
    </div>
  );
};

export default MentorQuizReviewPage;
