// src/features/quiz/components/QuizPage4.tsx
import React, { useState } from "react";
import type { UseQuizReturn } from "../hooks/useQuiz";
import type { TopicContentPage } from "../../spaces/types/node.types";
import HintCard from "./HintCard";
import HintRegenerateModal from "./HintRegenerateModal";
import HintDeleteDraftModal from "./HintDeleteDraftModal";
import QuizPublishConfirmModal from "./QuizPublishConfirmModal";
import QuizUnpublishConfirmModal from "./QuizUnpublishConfirmModal";
import HintGenerationDiagnosticsPanel from "./HintGenerationDiagnosticsPanel";

interface QuizPage4Props {
  qz: UseQuizReturn;
  onPageChange: (page: TopicContentPage) => void;
}

const QuizPage4: React.FC<QuizPage4Props> = ({ qz, onPageChange }) => {
  const [hintRegenerateTarget, setHintRegenerateTarget] = useState<{
    questionId: string;
    questionIndex: number;
    questionText: string;
  } | null>(null);

  if (qz.isLoadingQuiz || (qz.isViewingHistoryQuiz && qz.isLoadingHistoryQuiz)) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!qz.quiz && qz.isGeneratingHints) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
        <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Generating hints…</p>
      </div>
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
  const hintsLocked = qz.hintsLocked;
  const hintGeneration = quiz.qc_result?.hintGeneration;
  const questionsById = new Map(
    activeQuestions.map((question, index) => [
      question.question_id,
      { index, text: question.question_text },
    ]),
  );

  const handleScrollToQuestion = (questionId: string) => {
    onPageChange(3);
    setTimeout(() => {
      const el = document.getElementById(`quiz-question-${questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.outline = "2px solid var(--color-primary)";
        setTimeout(() => { el.style.outline = ""; }, 2000);
      }
    }, 150);
  };

  return (
    <div style={{ flex: 1, borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Top toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {quiz.title} — Hints
            </span>
            <span style={{
              fontSize: "0.6875rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", textTransform: "uppercase",
              background: hintsComplete ? "rgba(22,163,74,0.1)" : hintsPartial ? "rgba(245,158,11,0.1)" : "var(--color-bg-surface-alt)",
              color: hintsComplete ? "#16a34a" : hintsPartial ? "#b45309" : "var(--color-text-muted)",
              border: `1px solid ${hintsComplete ? "#16a34a" : hintsPartial ? "#f59e0b" : "var(--color-border)"}`,
            }}>
              Hints: {hintsComplete ? "Complete" : hintsPartial ? "Partial" : "None"}
            </span>
            {quiz.is_published && (
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid #16a34a" }}>
                Live for students
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => qz.setShowDeleteHintsModal(true)}
            disabled={quiz.is_published || hintsNone || qz.isDeletingHintsDraft}
            title={
              quiz.is_published
                ? "Remove the quiz from students before deleting hints"
                : hintsNone
                  ? "No hints have been generated yet"
                  : undefined
            }
            style={{
              padding: "0.4rem 0.875rem", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "none",
              color: "var(--color-danger, #dc2626)",
              cursor: quiz.is_published || hintsNone ? "not-allowed" : "pointer",
              fontSize: "0.8125rem", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "0.375rem",
              opacity: quiz.is_published || hintsNone ? 0.45 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
            Delete Draft
          </button>

          {/* Generate / Regenerate all hints */}
          {hintsNone ? (
            <button
              type="button"
              className="btn-primary"
              onClick={qz.handleGenerateHints}
              disabled={qz.isGeneratingHints || !qz.canGenerateHints}
              title={!qz.canGenerateHints ? (qz.hintsLockedTooltip ?? undefined) : undefined}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                opacity: hintsLocked ? 0.45 : 1,
                cursor: hintsLocked ? "not-allowed" : "pointer",
              }}
            >
              {qz.isGeneratingHints ? (
                <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} />Generating hints…</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>Generate All Hints</>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={qz.handleRegenerateAllHints}
              disabled={qz.isGeneratingHints || !qz.canRegenerateHints}
              title={!qz.canRegenerateHints ? (qz.hintsLockedTooltip ?? undefined) : undefined}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                opacity: hintsLocked ? 0.45 : 1,
                cursor: hintsLocked ? "not-allowed" : "pointer",
              }}
            >
              {qz.isGeneratingHints ? (
                <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} />Generating…</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>Regenerate All Hints</>
              )}
            </button>
          )}

          {!quiz.is_published && (
            <button
              type="button"
              className="btn-primary"
              onClick={qz.handlePublishQuiz}
              disabled={!qz.canPublishQuiz || qz.isPublishing}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem",
                opacity: !qz.canPublishQuiz ? 0.5 : 1,
                cursor: !qz.canPublishQuiz ? "not-allowed" : "pointer",
              }}
            >
              {qz.isPublishing ? "Making live…" : qz.publishQuizButtonLabel}
            </button>
          )}

          {quiz.is_published && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void qz.handleUnpublishQuiz()}
              disabled={qz.isUnpublishing}
              style={{ padding: "0.4rem 0.875rem", fontSize: "0.8125rem" }}
            >
              {qz.isUnpublishing ? "Removing…" : qz.unpublishQuizButtonLabel}
            </button>
          )}
        </div>
      </div>

      {/* Hints loading indicator */}
      {qz.isGeneratingHints && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "var(--color-primary-subtle)", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-primary)", flexShrink: 0 }}>
          <span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "var(--color-primary)" }} />
          Generating hints for all questions…
        </div>
      )}

      {hintGeneration && (
        <HintGenerationDiagnosticsPanel
          hintGeneration={hintGeneration}
          entityNextLlmRetryAt={quiz.next_llm_retry_at}
          questionsById={questionsById}
        />
      )}

      {/* Hint cards — infinitely scrollable */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {activeQuestions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: "0 0 0.375rem" }}>No questions yet</p>
            <p style={{ fontSize: "0.8125rem", margin: 0 }}>
              Go back to <button type="button" style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: 600 }} onClick={() => onPageChange(3)}>page 3</button> to add questions first.
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

      {hintRegenerateTarget && (
        <HintRegenerateModal
          questionIndex={hintRegenerateTarget.questionIndex}
          questionText={hintRegenerateTarget.questionText}
          isSubmitting={qz.isGeneratingHints}
          onClose={() => !qz.isGeneratingHints && setHintRegenerateTarget(null)}
          onConfirm={async (feedback) => {
            await qz.handleRegenerateHints(hintRegenerateTarget.questionId, feedback);
            setHintRegenerateTarget(null);
          }}
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
