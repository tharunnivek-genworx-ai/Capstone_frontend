import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { traineeQuizService } from "../services/traineeQuizService";
import type { CorrectOption, QuestionState, TraineeQuizOut } from "../types/traineeQuiz.types";
import { buildQuestionState } from "../utils/questionState";
import {
  parseAttemptError,
  type AbandonedAttemptTarget,
} from "../utils/attemptErrors";

interface UseQuizAttemptOptions {
  attemptId: string;
  spaceId: string;
}

function applyQuizData(data: TraineeQuizOut) {
  const sorted = [...data.questions].sort((a, b) => a.order_index - b.order_index);
  const questionStates: Record<string, QuestionState> = {};
  for (const q of sorted) {
    questionStates[q.question_id] = buildQuestionState(
      q,
      q.is_flagged,
    );
  }
  return { sorted, questionStates, resumeId: data.resume_question_id };
}

export function useQuizAttempt({ attemptId }: UseQuizAttemptOptions) {
  const [quiz, setQuiz] = useState<TraineeQuizOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TraineeQuizOut["questions"]>([]);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [pendingSelection, setPendingSelection] = useState<CorrectOption | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "incorrect" | null>(null);
  const [abandonedTarget, setAbandonedTarget] = useState<AbandonedAttemptTarget | null>(null);
  const pendingStateRef = useRef<Map<string, {
    is_visited?: boolean;
    is_flagged?: boolean;
    was_skipped?: boolean;
    resume_question_id?: string;
  }>>(new Map());
  const stateFlushTimerRef = useRef<number | null>(null);

  const flushNavigationState = useCallback(async () => {
    if (stateFlushTimerRef.current !== null) {
      window.clearTimeout(stateFlushTimerRef.current);
      stateFlushTimerRef.current = null;
    }
    const pending = [...pendingStateRef.current.entries()];
    pendingStateRef.current.clear();
    try {
      await Promise.all(
        pending.map(([questionId, patch]) =>
          traineeQuizService.patchAttemptState(attemptId, {
            question_id: questionId,
            ...patch,
          }),
        ),
      );
    } catch (error) {
      for (const [questionId, patch] of pending) {
        pendingStateRef.current.set(questionId, {
          ...patch,
          ...pendingStateRef.current.get(questionId),
        });
      }
      throw error;
    }
  }, [attemptId]);

  const queueNavigationState = useCallback((
    questionId: string,
    patch: {
      is_visited?: boolean;
      is_flagged?: boolean;
      was_skipped?: boolean;
      resume_question_id?: string;
    },
  ) => {
    pendingStateRef.current.set(questionId, {
      ...pendingStateRef.current.get(questionId),
      ...patch,
    });
    if (stateFlushTimerRef.current !== null) {
      window.clearTimeout(stateFlushTimerRef.current);
    }
    stateFlushTimerRef.current = window.setTimeout(() => {
      void flushNavigationState().catch(() => {
        // Navigation persistence is retried by the next interaction or Save & Exit.
      });
    }, 250);
  }, [flushNavigationState]);

  const loadAttempt = useCallback(async (preferredQuestionId?: string | null) => {
    setIsLoading(true);
    setLoadError(null);
    setAbandonedTarget(null);
    try {
      const data = await traineeQuizService.getAttempt(attemptId);
      const applied = applyQuizData(data);
      setQuiz(data);
      setQuestions(applied.sorted);
      setQuestionStates(applied.questionStates);
      setCurrentQuestionId(preferredQuestionId ?? applied.resumeId);
    } catch (err) {
      const parsed = parseAttemptError(err, "Failed to load quiz attempt.");
      setLoadError(parsed.message);
      setAbandonedTarget(parsed.abandonedTarget);
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  useEffect(() => () => {
    void flushNavigationState().catch(() => {});
  }, [flushNavigationState]);

  const currentQuestion = useMemo(
    () => questions.find((q) => q.question_id === currentQuestionId) ?? null,
    [questions, currentQuestionId],
  );

  const currentState = currentQuestion ? questionStates[currentQuestion.question_id] : null;

  useEffect(() => {
    if (!currentQuestionId || quiz?.attempt_status !== "in_progress") return;
    queueNavigationState(currentQuestionId, {
      is_visited: true,
      resume_question_id: currentQuestionId,
    });
  }, [currentQuestionId, quiz?.attempt_status, queueNavigationState]);

  useEffect(() => {
    if (!currentQuestion) {
      setPendingSelection(null);
      setFeedback(null);
      return;
    }
    setPendingSelection(currentQuestion.selected_option);
    if (currentQuestion.is_correct === true) setFeedback("success");
    else if (currentQuestion.is_correct === false && currentQuestion.selected_option) setFeedback("incorrect");
    else setFeedback(null);
  }, [currentQuestion]);

  const selectQuestion = useCallback((questionId: string) => {
    setCurrentQuestionId(questionId);
    queueNavigationState(questionId, {
      is_visited: true,
      resume_question_id: questionId,
    });
  }, [queueNavigationState]);

  const toggleFlag = useCallback(() => {
    if (!currentQuestionId) return;
    setQuestionStates((prev) => {
      const existing = prev[currentQuestionId];
      if (!existing) return prev;
      queueNavigationState(currentQuestionId, {
        is_flagged: !existing.isFlagged,
        is_visited: true,
        resume_question_id: currentQuestionId,
      });
      return {
        ...prev,
        [currentQuestionId]: { ...existing, isFlagged: !existing.isFlagged },
      };
    });
  }, [currentQuestionId, queueNavigationState]);

  const clearSelection = useCallback(() => {
    if (!currentQuestion?.can_answer) return;
    setPendingSelection(null);
    setFeedback(null);
  }, [currentQuestion]);

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || !pendingSelection || !currentQuestion.can_answer) return;

    setIsSubmittingAnswer(true);
    try {
      const response = await traineeQuizService.submitResponse(attemptId, {
        question_id: currentQuestion.question_id,
        selected_option: pendingSelection,
      });

      if (response.is_correct) toast.success("Correct answer!");
      await loadAttempt(response.next_question_id ?? response.resume_question_id);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to submit answer.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  }, [attemptId, currentQuestion, pendingSelection, loadAttempt]);

  const goToAdjacent = useCallback(
    (direction: -1 | 1) => {
      if (!currentQuestionId) return;
      const activeQuestions = questions.filter((q) => q.is_active);
      const idx = activeQuestions.findIndex((q) => q.question_id === currentQuestionId);
      const next = activeQuestions[idx + direction];
      if (next) selectQuestion(next.question_id);
    },
    [currentQuestionId, questions, selectQuestion],
  );

  const skipQuestion = useCallback(() => {
    if (currentQuestionId) {
      queueNavigationState(currentQuestionId, {
        is_visited: true,
        was_skipped: true,
      });
    }
    goToAdjacent(1);
  }, [currentQuestionId, goToAdjacent, queueNavigationState]);

  const expandHints = useCallback(() => {
    if (!currentQuestionId || !currentState) return;
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionId]: {
        ...prev[currentQuestionId],
        hintsExpanded: true,
        visibleHintCount: Math.max(prev[currentQuestionId].visibleHintCount, 1),
      },
    }));
  }, [currentQuestionId, currentState]);

  const showNextHint = useCallback(() => {
    if (!currentQuestionId || !currentState) return;
    const maxLevel = currentState.hintLevelUnlocked;
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionId]: {
        ...prev[currentQuestionId],
        visibleHintCount: Math.min(prev[currentQuestionId].visibleHintCount + 1, maxLevel, 3),
      },
    }));
  }, [currentQuestionId, currentState]);

  const collapseHints = useCallback(() => {
    if (!currentQuestionId) return;
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionId]: { ...prev[currentQuestionId], hintsExpanded: false },
    }));
  }, [currentQuestionId]);

  const submitQuiz = useCallback(async () => {
    setIsSubmittingQuiz(true);
    try {
      return await traineeQuizService.submitAttempt(attemptId);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to submit quiz.");
      return null;
    } finally {
      setIsSubmittingQuiz(false);
    }
  }, [attemptId]);

  const currentIndex = useMemo(() => {
    const active = questions.filter((q) => q.is_active);
    return active.findIndex((q) => q.question_id === currentQuestionId);
  }, [questions, currentQuestionId]);

  const activeQuestionCount = useMemo(
    () => questions.filter((q) => q.is_active).length,
    [questions],
  );

  return {
    quiz,
    isLoading,
    loadError,
    questions,
    questionStates,
    currentQuestion,
    currentState,
    currentIndex,
    activeQuestionCount,
    currentQuestionId,
    pendingSelection,
    setPendingSelection,
    feedback,
    isSubmittingAnswer,
    isSubmittingQuiz,
    abandonedTarget,
    selectQuestion,
    toggleFlag,
    clearSelection,
    submitAnswer,
    skipQuestion,
    expandHints,
    showNextHint,
    collapseHints,
    goToAdjacent,
    submitQuiz,
    flushNavigationState,
    reload: loadAttempt,
  };
}
