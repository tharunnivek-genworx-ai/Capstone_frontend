// src/features/quiz/components/QuizPage3.tsx
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
import { isLlmRateLimited } from "../../study_material/utils/llmDiagnostics";
import { shouldShowQcWarning } from "../../study_material/utils/qcDisplayUtils";
import GenerationProgressPanel from "../../generation/components/GenerationProgressPanel";
import { useGenerationProgress } from "../../generation/hooks/useGenerationProgress";
import { useGenerationRunResume } from "../../generation/hooks/useGenerationRunResume";

interface QuizPage3Props {
  nodeTitle: string;
  qz: UseQuizReturn;
}

const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const QuizPage3: React.FC<QuizPage3Props> = ({ nodeTitle, qz }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [localQuestionIds, setLocalQuestionIds] = useState<string[] | null>(null);
  const [questionCountInput, setQuestionCountInput] = useState(String(qz.questionCount));
  const showQuizGenerationUi =
    qz.isGenerating ||
    Boolean(qz.isRegeneratingQuestion) ||
    (qz.generationRunFailed && qz.failedGenerationPipeline === "quiz");
  const generationProgress = useGenerationProgress(
    qz.generationProgressSessionId,
    showQuizGenerationUi,
  );
  const quizRunResume = useGenerationRunResume(
    qz.generationRunFailed && qz.failedGenerationPipeline === "quiz"
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
      await qz.handleCreateQuestion(data as QuizQuestionCreateRequest);
      setShowAddModal(false);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  useEffect(() => {
    setQuestionCountInput(String(qz.questionCount));
  }, [qz.questionCount]);

  const commitQuestionCountInput = () => {
    const parsed = Number.parseInt(questionCountInput, 10);
    const clamped = Number.isFinite(parsed) ? Math.max(5, Math.min(20, parsed)) : qz.questionCount;
    qz.setQuestionCount(clamped);
    setQuestionCountInput(String(clamped));
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
        resumable={quizRunResume.resumable}
        secondsUntilRetry={quizRunResume.secondsUntilRetry}
        isResuming={qz.isResumingFailedGeneration}
        onResume={qz.handleResumeFailedGeneration}
        onDismissFailed={qz.handleDismissFailedGeneration}
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
                className="quiz-page__btn quiz-page__btn--danger"
                onClick={() => void qz.handleDeleteHistoryQuiz(historyQuiz.quiz_id)}
                disabled={qz.isDeletingDraft}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn-secondary quiz-page__btn" onClick={qz.handleCloseHistoryView}>
              Close
            </button>
          </div>
        </div>

        <div className="quiz-page__header">
          <div className="quiz-page__title-block">
            <span className="quiz-page__title">{historyQuiz.title}</span>
            <div className="quiz-page__meta">
              <span className="quiz-page__meta-text">
                {historyQuiz.total_questions} questions · {historyDifficulty}
                {historyItem?.version_label ? ` · ${historyItem.version_label}` : ""}
              </span>
            </div>
          </div>
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
              onUpdate={async () => {}}
              onDelete={async () => {}}
              onRegenerate={async () => {}}
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
    );
  }

  // ── Generation form (no workspace quiz yet) ─────────────────────────────
  if (!qz.quiz) {
    return (
      <div style={{ flex: 1, borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", overflowY: "auto" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.375rem", fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Generate Quiz
          </h3>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Configure and generate MCQ quiz questions from your study material.
          </p>

          {!qz.canGenerateQuiz && qz.generateDisabledTooltip && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {qz.generateDisabledTooltip}
            </p>
          )}

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
              Number of questions
            </label>
            <input
              type="number"
              className="input-field"
              value={questionCountInput}
              min={5}
              max={20}
              onChange={(e) => setQuestionCountInput(e.target.value)}
              onBlur={commitQuestionCountInput}
              style={{ width: "140px", fontSize: "0.9375rem" }}
            />
            <span style={{ marginLeft: "0.625rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              (5 – 20)
            </span>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
              Difficulty
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => qz.setDifficulty(value)}
                  style={{
                    padding: "0.4rem 1rem", borderRadius: "var(--radius-md)",
                    border: `1px solid ${qz.difficulty === value ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: qz.difficulty === value ? "var(--color-primary-subtle)" : "var(--color-bg-surface)",
                    color: qz.difficulty === value ? "var(--color-primary)" : "var(--color-text-secondary)",
                    cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              commitQuestionCountInput();
              void qz.handleGenerate();
            }}
            disabled={qz.isGenerating || !qz.canGenerateQuiz}
            title={!qz.canGenerateQuiz ? qz.generateDisabledTooltip ?? undefined : undefined}
            style={{ padding: "0.625rem 1.5rem", fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: "0.625rem" }}
          >
            {qz.isGenerating ? (
              <>
                <span className="spinner" style={{ width: "1rem", height: "1rem" }} />
                Generating quiz…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Generate Quiz
              </>
            )}
          </button>
        </div>

        <QuizHistoryPanel
          history={qz.quizHistory}
          onView={(quizId) => void qz.handleViewHistoryQuiz(quizId)}
          onDelete={(quizId) => void qz.handleDeleteHistoryQuiz(quizId)}
          isDeleting={qz.isDeletingDraft}
          viewingQuizId={qz.viewingHistoryItem?.quiz_id ?? null}
        />
      </div>
    );
  }

  const quiz = qz.quiz!;
  const difficultyLabel = DIFFICULTY_OPTIONS.find((d) => d.value === quiz.difficulty)?.label ?? quiz.difficulty;
  const displayTitle = quiz.title || `${nodeTitle} — Quiz`;
  const rateLimited = isLlmRateLimited(quiz.qc_result);

  const showQcWarning = shouldShowQcWarning(quiz.qc_failed_permanently, quiz.qc_result);

  const needsHintsBeforePublish = !quiz.is_published && quiz.hints_status !== "complete";
  const showCombinedHintsCta = needsHintsBeforePublish && activeQuestions.length > 0;

  return (
    <div className="quiz-page">
      <div className="quiz-page__body-row">
        <div className="quiz-page__main">
          <div className="quiz-page__header">
            <div className="quiz-page__header-top">
              <div className="quiz-page__title-block">
                <span className="quiz-page__title">{displayTitle}</span>
                <div className="quiz-page__meta">
                  <span className={`quiz-page__badge ${quiz.is_published ? "quiz-page__badge--live" : "quiz-page__badge--draft"}`}>
                    {quiz.is_published ? "Live" : "Draft"}
                  </span>
                  <span className="quiz-page__meta-text">
                    {quiz.total_questions} questions · {difficultyLabel}
                  </span>
                </div>
                {qz.showUpdateQuizNudge && (
                  <div
                    className="quiz-page__sm-update-nudge"
                    role="status"
                    style={{
                      marginTop: "0.75rem",
                      border: "1px solid #d97706",
                      backgroundColor: "#fffbeb",
                      borderRadius: "var(--radius-lg)",
                      padding: "0.875rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.625rem",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      style={{ flexShrink: 0, marginTop: "0.125rem" }}
                      aria-hidden="true"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#92400e" }}>
                        Study material was updated
                      </span>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#b45309", lineHeight: 1.45 }}>
                        {qz.quizSmVersionLabel
                          ? <>This quiz was generated for <strong>{qz.quizSmVersionLabel}</strong>. The study material has since been updated — consider regenerating the quiz so questions match the latest content.</>
                          : "The study material has been updated — consider regenerating the quiz so questions match the latest content."
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="quiz-page__actions">
                <button
                  type="button"
                  className="quiz-page__btn quiz-page__btn--danger"
                  onClick={() => qz.setShowDeleteDraftModal(true)}
                  disabled={quiz.is_published || qz.isDeletingDraft}
                  title={quiz.is_published ? "Remove the quiz from students before deleting the draft" : undefined}
                >
                  Delete
                </button>
                {!quiz.is_published && (
                  <button
                    type="button"
                    className="btn-secondary quiz-page__btn"
                    onClick={() => {
                      if (qz.showUpdateQuizNudge) {
                        void qz.handleGenerate();
                      } else {
                        qz.setShowRegenerateModal(true);
                      }
                    }}
                    disabled={
                      qz.isGenerating
                      || (qz.showUpdateQuizNudge ? !qz.canGenerateQuiz : !qz.canRegenerateQuiz)
                    }
                  >
                    {qz.showUpdateQuizNudge ? "Regenerate for new SM" : "Regenerate"}
                  </button>
                )}
                {showCombinedHintsCta ? (
                  <button
                    type="button"
                    className="btn-primary quiz-page__btn"
                    onClick={qz.handleProceedToHints}
                    disabled={qz.isGenerating}
                    title="Hints must be generated before the quiz can go live for students"
                  >
                    {quiz.hints_status === "partial"
                      ? "Continue generating hints…"
                      : "Generate hints and then publish quiz"}
                  </button>
                ) : (
                  <>
                    {!quiz.is_published && (
                      <button
                        type="button"
                        className="btn-secondary quiz-page__btn"
                        onClick={qz.handleProceedToHints}
                        disabled={qz.isGenerating || activeQuestions.length === 0}
                        title="Proceed to hint generation"
                      >
                        Hints →
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary quiz-page__btn"
                      onClick={qz.handlePublishQuiz}
                      disabled={!qz.canPublishQuiz || qz.isPublishing || quiz.is_published}
                      title={!qz.canPublishQuiz ? qz.publishDisabledTooltip ?? undefined : undefined}
                    >
                      {qz.isPublishing ? "Making live…" : qz.publishQuizButtonLabel}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn-secondary quiz-page__btn"
                  onClick={() => void qz.handleUnpublishQuiz()}
                  disabled={!quiz.is_published || qz.isUnpublishing}
                >
                  {qz.isUnpublishing ? "Removing…" : "Unpublish"}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="quiz-page__answer-key-toggle"
              onClick={() => qz.setShowAnswerKey(!qz.showAnswerKey)}
            >
              {qz.showAnswerKey ? "Hide answer key" : "Show answer key"}
            </button>
          </div>

          <div className="quiz-page__scroll">
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
                  {allQuestionsForDisplay.map((q) => (
                    <QuizQuestionCard
                      key={q.question_id}
                      question={q}
                      index={activeQuestions.indexOf(q)}
                      isPublished={quiz.is_published}
                      canEdit={qz.canEditQuestions}
                      isSaving={isSavingQuestion}
                      isDeleting={qz.isDeletingQuestion === q.question_id}
                      isRegenerating={qz.isRegeneratingQuestion === q.question_id}
                      onUpdate={qz.handleUpdateQuestion}
                      onDelete={qz.handleDeleteQuestion}
                      onRegenerate={qz.handleRegenerateQuestion}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* Add question button */}
            {!qz.isGenerating && !quiz.is_published && !rateLimited && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                disabled={!qz.canEditQuestions}
                style={{
                  width: "100%", padding: "0.75rem",
                  border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
                  background: "none", cursor: !qz.canEditQuestions ? "not-allowed" : "pointer",
                  color: "var(--color-text-muted)", fontSize: "0.875rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  marginBottom: "1rem",
                  opacity: !qz.canEditQuestions ? 0.5 : 1,
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!qz.canEditQuestions) return;
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!qz.canEditQuestions) return;
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-muted)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Question
              </button>
            )}
          </div>
        </div>

        {/* Right Column: QC Warning Panel */}
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

      {/* Modals */}
      {qz.showRegenerateModal && (
        <QuizRegenerateModal
          nodeTitle={nodeTitle}
          quizTitle={quiz.title}
          hasGeneratedHints={quiz.hints_status !== "none"}
          isSubmitting={qz.isGenerating}
          questionCount={qz.questionCount}
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
          isSubmitting={qz.isPublishing}
          onClose={() => !qz.isPublishing && qz.setShowPublishConfirmModal(false)}
          onConfirm={() => void qz.confirmPublishQuiz()}
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

export default QuizPage3;
