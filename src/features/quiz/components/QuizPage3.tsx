// src/features/quiz/components/QuizPage3.tsx
import React, { useState } from "react";
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
import QuizQuestionModal from "./QuizQuestionModal";

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

  // ── Generation form (no quiz yet) ──────────────────────────────────────
  if (!qz.quiz && !qz.isLoadingQuiz) {
    return (
      <div style={{ flex: 1, borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", overflowY: "auto" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.375rem", fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Generate Quiz
          </h3>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Configure and generate MCQ quiz questions from the published study material.
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
              value={qz.questionCount}
              min={5}
              max={20}
              onChange={(e) => qz.setQuestionCount(Math.max(5, Math.min(20, parseInt(e.target.value) || 10)))}
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
            onClick={qz.handleGenerate}
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
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────
  if (qz.isLoadingQuiz) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  const quiz = qz.quiz!;
  const difficultyLabel = DIFFICULTY_OPTIONS.find((d) => d.value === quiz.difficulty)?.label ?? quiz.difficulty;
  const displayTitle = qz.quizTitleWithVersion ?? `${quiz.title} — Quiz`;

  return (
    <div style={{ flex: 1, borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {qz.showStaleTabPrompt && (
        <div style={{ marginBottom: "0.75rem", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", background: "var(--color-bg-surface-alt)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            This page is outdated — the study material was updated elsewhere.
          </span>
          <button type="button" className="btn-secondary" onClick={qz.refreshQuizPage} style={{ fontSize: "0.8125rem" }}>
            Refresh Page
          </button>
        </div>
      )}
      {/* Top toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {displayTitle}
            </span>
            <span style={{
              fontSize: "0.6875rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", textTransform: "uppercase",
              background: quiz.is_published ? "rgba(22,163,74,0.1)" : "var(--color-primary-subtle)",
              color: quiz.is_published ? "#16a34a" : "var(--color-primary)",
              border: `1px solid ${quiz.is_published ? "#16a34a" : "var(--color-primary)"}`,
            }}>
              {quiz.is_published ? "Published" : "Draft"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {quiz.total_questions} questions · {difficultyLabel}
            </span>
          </div>
          {qz.staleHelperText && (
            <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {qz.staleHelperText}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
          {qz.isStaleVersion && qz.generateNewQuizCtaLabel ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                qz.setShowRegenerateModal(false);
                void qz.handleGenerate();
              }}
              disabled={qz.isGenerating || !qz.canGenerateQuiz}
              style={{ padding: "0.4rem 0.875rem", fontSize: "0.8125rem" }}
            >
              ↺ {qz.generateNewQuizCtaLabel}
            </button>
          ) : (
          <>
          <button
            type="button"
            onClick={() => qz.setShowDeleteDraftModal(true)}
            disabled={quiz.is_published || qz.isDeletingDraft}
            title={quiz.is_published ? "Unpublish the quiz before deleting the draft" : undefined}
            style={{
              padding: "0.4rem 0.875rem", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "none",
              color: "var(--color-danger, #dc2626)",
              cursor: quiz.is_published ? "not-allowed" : "pointer",
              fontSize: "0.8125rem", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "0.375rem",
              opacity: quiz.is_published ? 0.45 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
            Delete Draft
          </button>
          {!quiz.is_published && (
            <button
              type="button"
              onClick={() => qz.setShowRegenerateModal(true)}
              disabled={qz.isGenerating || !qz.canRegenerateQuiz}
              title={!qz.canRegenerateQuiz ? qz.regenerateQuizDisabledTooltip ?? undefined : undefined}
              className="btn-secondary"
              style={{ padding: "0.4rem 0.875rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.375rem", opacity: !qz.canRegenerateQuiz ? 0.5 : 1 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              Regenerate
            </button>
          )}
          {!quiz.is_published && (
            <button
              type="button"
              className="btn-secondary"
              onClick={qz.handleProceedToHints}
              disabled={qz.isGenerating || activeQuestions.length === 0}
              style={{ padding: "0.4rem 0.875rem", fontSize: "0.8125rem" }}
            >
              Proceed to Hint Generation
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={qz.handlePublishQuiz}
            disabled={!qz.canPublishQuiz || qz.isPublishing || quiz.is_published}
            title={!qz.canPublishQuiz ? qz.publishDisabledTooltip ?? undefined : undefined}
            style={{
              padding: "0.4rem 0.875rem",
              fontSize: "0.8125rem",
              opacity: !qz.canPublishQuiz || quiz.is_published ? 0.5 : 1,
              cursor: !qz.canPublishQuiz || quiz.is_published ? "not-allowed" : "pointer",
            }}
          >
            {qz.isPublishing ? "Publishing…" : "Publish Quiz"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={qz.handleUnpublishQuiz}
            disabled={!quiz.is_published || qz.isUnpublishing}
            style={{ padding: "0.4rem 0.875rem", fontSize: "0.8125rem", opacity: quiz.is_published ? 1 : 0.5 }}
          >
            {qz.isUnpublishing ? "Unpublishing…" : "Unpublish Quiz"}
          </button>
          </>
          )}
        </div>
      </div>

      {/* Answer key toggle */}
      <div style={{ marginBottom: "0.875rem", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => qz.setShowAnswerKey(!qz.showAnswerKey)}
          style={{
            padding: "0.375rem 0.875rem", borderRadius: "var(--radius-md)",
            border: `1px solid ${qz.showAnswerKey ? "var(--color-primary)" : "var(--color-border)"}`,
            background: qz.showAnswerKey ? "var(--color-primary-subtle)" : "var(--color-bg-surface)",
            color: qz.showAnswerKey ? "var(--color-primary)" : "var(--color-text-secondary)",
            cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {qz.showAnswerKey ? "Hide Answer Key" : "Show Answer Key"}
        </button>
      </div>

      {/* Answer key panel */}
      {qz.showAnswerKey && <QuizAnswerKeyPanel questions={quiz.questions} />}

      {/* Questions list — infinitely scrollable */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {qz.isGenerating && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            <span className="spinner" style={{ width: "1.25rem", height: "1.25rem", borderTopColor: "var(--color-primary)" }} />
            Generating new quiz draft…
          </div>
        )}

        {!qz.isGenerating && quiz.questions.length === 0 && (
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
                  isLinkedVersionPublished={qz.isLinkedVersionPublished}
                  isSaving={isSavingQuestion}
                  isDeleting={qz.isDeletingQuestion === q.question_id}
                  onUpdate={qz.handleUpdateQuestion}
                  onDelete={qz.handleDeleteQuestion}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Add question button */}
        {!qz.isGenerating && !quiz.is_published && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={!qz.isLinkedVersionPublished}
            title={!qz.isLinkedVersionPublished ? "To edit or publish this quiz, first re-publish the associated study material version." : undefined}
            style={{
              width: "100%", padding: "0.75rem",
              border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
              background: "none", cursor: !qz.isLinkedVersionPublished ? "not-allowed" : "pointer",
              color: "var(--color-text-muted)", fontSize: "0.875rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              marginBottom: "1rem",
              opacity: !qz.isLinkedVersionPublished ? 0.5 : 1,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!qz.isLinkedVersionPublished) return;
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.color = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              if (!qz.isLinkedVersionPublished) return;
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

      {/* Modals */}
      {qz.showRegenerateModal && (
        <QuizRegenerateModal
          nodeTitle={nodeTitle}
          quizTitle={quiz.title}
          hasGeneratedHints={quiz.hints_status !== "none"}
          isSubmitting={qz.isGenerating}
          onClose={() => !qz.isGenerating && qz.setShowRegenerateModal(false)}
          onConfirm={qz.handleRegenerate}
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
