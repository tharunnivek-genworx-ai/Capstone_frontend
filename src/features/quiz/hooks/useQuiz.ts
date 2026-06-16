// src/features/quiz/hooks/useQuiz.ts
import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { TopicContentPage } from "../../spaces/types/node.types";
import type {
  QuizDifficulty,
  QuizMentorUiStateOut,
  QuizOut,
  QuizQuestionCreateRequest,
  QuizQuestionUpdateRequest,
} from "../types/quiz.types";
import { quizService } from "../services/quizService";

interface UseQuizParams {
  node: NodeTreeNode | null;
  isMentor: boolean;
  spaceIsPublished?: boolean;
  currentPage: TopicContentPage;
  canAccessQuiz: boolean;
  currentQuizId: string | null;
  onQuizIdChange: (quizId: string | null) => void;
  onPageChange: (page: TopicContentPage) => void;
}

export interface UseQuizReturn {
  quiz: QuizOut | null;
  isLoadingQuiz: boolean;
  isGenerating: boolean;
  isGeneratingHints: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeletingDraft: boolean;
  isDeletingHintsDraft: boolean;
  isDeletingQuestion: string | null;
  quizDraftExists: boolean;
  canGenerateQuiz: boolean;
  generateDisabledTooltip: string | null;
  canPublishQuiz: boolean;
  publishDisabledTooltip: string | null;
  canAccessHints: boolean;
  hintsLocked: boolean;
  hintsLockedTooltip: string | null;
  canGenerateHints: boolean;
  canRegenerateHints: boolean;
  isLinkedVersionPublished: boolean;
  isStaleVersion: boolean;
  staleHelperText: string | null;
  generateNewQuizCtaLabel: string | null;
  quizTitleWithVersion: string | null;
  canEditQuestions: boolean;
  canRegenerateQuiz: boolean;
  editQuestionDisabledTooltip: string | null;
  regenerateQuizDisabledTooltip: string | null;
  showStaleTabPrompt: boolean;
  dismissStaleTabPrompt: () => void;
  refreshQuizPage: () => void;

  // page 3 form state
  questionCount: number;
  setQuestionCount: (n: number) => void;
  difficulty: QuizDifficulty;
  setDifficulty: (d: QuizDifficulty) => void;

  // UI toggles
  showAnswerKey: boolean;
  setShowAnswerKey: (v: boolean) => void;
  showRegenerateModal: boolean;
  setShowRegenerateModal: (v: boolean) => void;
  showDeleteDraftModal: boolean;
  setShowDeleteDraftModal: (v: boolean) => void;
  showDeleteHintsModal: boolean;
  setShowDeleteHintsModal: (v: boolean) => void;

  // handlers
  handleGenerate: () => Promise<void>;
  handleRegenerate: (feedback: string) => Promise<void>;
  handleDeleteDraft: () => Promise<void>;
  handleDeleteHintsDraft: () => Promise<void>;
  handlePublishQuiz: () => Promise<void>;
  handleUnpublishQuiz: () => Promise<void>;
  handleUpdateQuestion: (questionId: string, data: QuizQuestionUpdateRequest) => Promise<void>;
  handleDeleteQuestion: (questionId: string) => Promise<void>;
  handleCreateQuestion: (data: QuizQuestionCreateRequest) => Promise<void>;
  handleReorderQuestions: (questionIds: string[]) => Promise<void>;
  handleGenerateHints: () => Promise<void>;
  handleRegenerateAllHints: () => Promise<void>;
  handleRegenerateHints: (questionId: string, feedback?: string) => Promise<void>;
  handleProceedToHints: () => void;
}

function extractErrorDetail(err: unknown): string {
  const e = err as {
    response?: { data?: string | { detail?: string | { message?: string } } };
    message?: string;
  };
  const data = e?.response?.data;
  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.detail === "object" && data.detail?.message) return data.detail.message;
  return e?.message ?? "Request failed.";
}

function isQuizVersionNotPublishedError(err: unknown): boolean {
  const e = err as {
    response?: { status?: number; data?: { detail?: { error?: string } | string } };
  };
  if (e?.response?.status !== 409) return false;
  const detail = e?.response?.data?.detail;
  return typeof detail === "object" && detail?.error === "QUIZ_VERSION_NOT_PUBLISHED";
}

function applyMentorUiState(
  state: QuizMentorUiStateOut,
  setters: {
    setQuizDraftExists: (v: boolean) => void;
    setCanGenerateQuiz: (v: boolean) => void;
    setGenerateDisabledTooltip: (v: string | null) => void;
    setCanAccessHints: (v: boolean) => void;
    setHintsLocked: (v: boolean) => void;
    setHintsLockedTooltip: (v: string | null) => void;
    setCanGenerateHints: (v: boolean) => void;
    setCanRegenerateHints: (v: boolean) => void;
    setCanPublishQuiz: (v: boolean) => void;
    setPublishDisabledTooltip: (v: string | null) => void;
    setCanEditQuestions: (v: boolean) => void;
    setCanRegenerateQuiz: (v: boolean) => void;
    setEditQuestionDisabledTooltip: (v: string | null) => void;
    setRegenerateQuizDisabledTooltip: (v: string | null) => void;
    setQuiz: (v: QuizOut | null) => void;
    setIsLinkedVersionPublished: (v: boolean) => void;
    setIsStaleVersion: (v: boolean) => void;
    setStaleHelperText: (v: string | null) => void;
    setGenerateNewQuizCtaLabel: (v: string | null) => void;
    setQuizTitleWithVersion: (v: string | null) => void;
  },
  options: { includeQuiz?: boolean } = {},
) {
  setters.setQuizDraftExists(state.quiz_draft_exists);
  setters.setCanGenerateQuiz(state.can_generate_quiz);
  setters.setGenerateDisabledTooltip(state.generate_disabled_tooltip ?? null);
  setters.setCanAccessHints(state.can_access_hints);
  setters.setHintsLocked(state.hints_locked);
  setters.setHintsLockedTooltip(state.hints_locked_tooltip ?? null);
  setters.setCanGenerateHints(state.can_generate_hints);
  setters.setCanRegenerateHints(state.can_regenerate_hints);
  setters.setCanPublishQuiz(state.can_publish_quiz);
  setters.setPublishDisabledTooltip(state.publish_disabled_tooltip ?? null);
  setters.setCanEditQuestions(state.can_edit_questions);
  setters.setCanRegenerateQuiz(state.can_regenerate_quiz);
  setters.setEditQuestionDisabledTooltip(state.edit_question_disabled_tooltip ?? null);
  setters.setRegenerateQuizDisabledTooltip(state.regenerate_quiz_disabled_tooltip ?? null);
  setters.setIsLinkedVersionPublished(state.is_linked_version_published ?? false);
  setters.setIsStaleVersion(state.is_stale_version ?? false);
  setters.setStaleHelperText(state.stale_helper_text ?? null);
  setters.setGenerateNewQuizCtaLabel(state.generate_new_quiz_cta_label ?? null);
  setters.setQuizTitleWithVersion(state.quiz_title_with_version ?? null);
  if (options.includeQuiz) {
    setters.setQuiz(state.quiz);
  }
}

export function useQuiz({
  node,
  isMentor,
  spaceIsPublished,
  currentPage,
  canAccessQuiz,
  currentQuizId,
  onQuizIdChange,
  onPageChange,
}: UseQuizParams): UseQuizReturn {
  const [quiz, setQuiz] = useState<QuizOut | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHints, setIsGeneratingHints] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);
  const [isDeletingHintsDraft, setIsDeletingHintsDraft] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState<string | null>(null);
  const [quizDraftExists, setQuizDraftExists] = useState(false);
  const [canGenerateQuiz, setCanGenerateQuiz] = useState(false);
  const [generateDisabledTooltip, setGenerateDisabledTooltip] = useState<string | null>(null);
  const [canPublishQuiz, setCanPublishQuiz] = useState(false);
  const [publishDisabledTooltip, setPublishDisabledTooltip] = useState<string | null>(null);
  const [canAccessHints, setCanAccessHints] = useState(false);
  const [hintsLocked, setHintsLocked] = useState(false);
  const [hintsLockedTooltip, setHintsLockedTooltip] = useState<string | null>(null);
  const [canGenerateHints, setCanGenerateHints] = useState(false);
  const [canRegenerateHints, setCanRegenerateHints] = useState(false);
  const [isLinkedVersionPublished, setIsLinkedVersionPublished] = useState(false);
  const [isStaleVersion, setIsStaleVersion] = useState(false);
  const [staleHelperText, setStaleHelperText] = useState<string | null>(null);
  const [generateNewQuizCtaLabel, setGenerateNewQuizCtaLabel] = useState<string | null>(null);
  const [quizTitleWithVersion, setQuizTitleWithVersion] = useState<string | null>(null);
  const [canEditQuestions, setCanEditQuestions] = useState(false);
  const [canRegenerateQuiz, setCanRegenerateQuiz] = useState(false);
  const [editQuestionDisabledTooltip, setEditQuestionDisabledTooltip] = useState<string | null>(null);
  const [regenerateQuizDisabledTooltip, setRegenerateQuizDisabledTooltip] = useState<string | null>(null);
  const [showStaleTabPrompt, setShowStaleTabPrompt] = useState(false);

  const handleMutationError = useCallback((err: unknown) => {
    if (isQuizVersionNotPublishedError(err)) {
      setShowStaleTabPrompt(true);
      return;
    }
    toast.error(extractErrorDetail(err));
  }, []);

  // Page 3 form state
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("mixed");

  // UI state
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false);
  const [showDeleteHintsModal, setShowDeleteHintsModal] = useState(false);

  const nodeIdRef = useRef<string | null>(null);
  const onQuizIdChangeRef = useRef(onQuizIdChange);
  onQuizIdChangeRef.current = onQuizIdChange;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const currentQuizIdRef = useRef(currentQuizId);
  currentQuizIdRef.current = currentQuizId;
  const syncGenerationRef = useRef(0);

  const setResolvedQuizId = useCallback((quizId: string | null) => {
    currentQuizIdRef.current = quizId;
    onQuizIdChangeRef.current(quizId);
  }, []);

  // Keep ref aligned with parent state (e.g. when switching nodes).
  useEffect(() => {
    currentQuizIdRef.current = currentQuizId;
  }, [node?.node_id, currentQuizId]);

  const mentorStateSetters = {
    setQuizDraftExists,
    setCanGenerateQuiz,
    setGenerateDisabledTooltip,
    setCanAccessHints,
    setHintsLocked,
    setHintsLockedTooltip,
    setCanGenerateHints,
    setCanRegenerateHints,
    setCanPublishQuiz,
    setPublishDisabledTooltip,
    setCanEditQuestions,
    setCanRegenerateQuiz,
    setEditQuestionDisabledTooltip,
    setRegenerateQuizDisabledTooltip,
    setQuiz,
    setIsLinkedVersionPublished,
    setIsStaleVersion,
    setStaleHelperText,
    setGenerateNewQuizCtaLabel,
    setQuizTitleWithVersion,
  };

  // Reset when node changes
  useEffect(() => {
    if (!node) return;
    if (nodeIdRef.current === node.node_id) return;
    nodeIdRef.current = node.node_id;
    setQuiz(null);
    setIsLoadingQuiz(false);
    setIsGenerating(false);
    setIsGeneratingHints(false);
    setIsPublishing(false);
    setIsUnpublishing(false);
    setIsDeletingDraft(false);
    setIsDeletingHintsDraft(false);
    setShowAnswerKey(false);
    setShowRegenerateModal(false);
    setShowDeleteDraftModal(false);
    setShowDeleteHintsModal(false);
    setQuizDraftExists(false);
    setCanGenerateQuiz(false);
    setGenerateDisabledTooltip(null);
    setCanPublishQuiz(false);
    setPublishDisabledTooltip(null);
    setCanAccessHints(false);
    setHintsLocked(false);
    setHintsLockedTooltip(null);
    setCanGenerateHints(false);
    setCanRegenerateHints(false);
    setIsLinkedVersionPublished(false);
    setIsStaleVersion(false);
    setStaleHelperText(null);
    setGenerateNewQuizCtaLabel(null);
    setQuizTitleWithVersion(null);
    setCanEditQuestions(false);
    setCanRegenerateQuiz(false);
    setEditQuestionDisabledTooltip(null);
    setRegenerateQuizDisabledTooltip(null);
    setShowStaleTabPrompt(false);
  }, [node?.node_id, handleMutationError]);

  // Sync mentor quiz state from the backend (resolution + optional full quiz load).
  useEffect(() => {
    if (!node || !canAccessQuiz || !isMentor) return;

    let cancelled = false;
    const generation = ++syncGenerationRef.current;

    const syncQuiz = async () => {
      try {
        const includeQuiz =
          (currentPage === 3 || currentPage === 4) && !isGenerating;

        const state = await quizService.getMentorUiState(node.node_id, {
          preferredQuizId: currentQuizIdRef.current,
          includeQuiz,
        });
        if (cancelled || generation !== syncGenerationRef.current) return;

        applyMentorUiState(state, mentorStateSetters, { includeQuiz });

        if (state.resolved_quiz_id !== currentQuizIdRef.current) {
          setResolvedQuizId(state.resolved_quiz_id);
        }
      } catch (err) {
        if (cancelled || generation !== syncGenerationRef.current) return;
        handleMutationError(err);
        setQuiz(null);
        setResolvedQuizId(null);
      } finally {
        if (!cancelled && generation === syncGenerationRef.current && (currentPage === 3 || currentPage === 4)) {
          setIsLoadingQuiz(false);
        }
      }
    };

    if (currentPage === 3 || currentPage === 4) {
      setIsLoadingQuiz(true);
    }

    void syncQuiz();
    return () => {
      cancelled = true;
    };
  }, [
    node?.node_id,
    canAccessQuiz,
    isMentor,
    currentPage,
    isGenerating,
    spaceIsPublished,
    handleMutationError,
  ]);

  const refreshQuiz = useCallback(async (preferredQuizId?: string | null) => {
    if (!node) return;
    const preferred = preferredQuizId !== undefined ? preferredQuizId : currentQuizIdRef.current;
    const generation = ++syncGenerationRef.current;
    try {
      const state = await quizService.getMentorUiState(node.node_id, {
        preferredQuizId: preferred,
        includeQuiz: true,
      });
      if (generation !== syncGenerationRef.current) return;
      applyMentorUiState(state, mentorStateSetters, { includeQuiz: true });
      if (state.resolved_quiz_id !== preferred) {
        setResolvedQuizId(state.resolved_quiz_id);
      }
    } catch (err) {
      if (generation !== syncGenerationRef.current) return;
      handleMutationError(err);
    }
  }, [node?.node_id, handleMutationError]);

  const handleGenerate = useCallback(async () => {
    if (!node || isGenerating || !canGenerateQuiz) return;
    setIsGenerating(true);
    try {
      const generated = await quizService.generate(node.node_id, {
        difficulty,
        question_count: questionCount,
        mode: "generate",
      });
      setQuiz(generated);
      setResolvedQuizId(generated.quiz_id);
      toast.success("Quiz draft generated successfully.");
      await refreshQuiz(generated.quiz_id);
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [node?.node_id, canGenerateQuiz, difficulty, questionCount, isGenerating, refreshQuiz]);

  const handleRegenerate = useCallback(async (feedback: string) => {
    if (!node || !quiz || isGenerating || !canGenerateQuiz) return;
    setIsGenerating(true);
    setShowRegenerateModal(false);
    try {
      const generated = await quizService.generate(node.node_id, {
        difficulty: quiz.difficulty,
        question_count: quiz.total_questions || questionCount,
        mode: "regenerate",
        quiz_id: quiz.quiz_id,
        mentor_feedback: feedback || undefined,
      });
      setQuiz(generated);
      setResolvedQuizId(generated.quiz_id);
      toast.success("Quiz regenerated successfully.");
      await refreshQuiz(generated.quiz_id);
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [node?.node_id, canGenerateQuiz, quiz, questionCount, isGenerating, refreshQuiz]);

  const handleDeleteDraft = useCallback(async () => {
    if (!node || !quiz || isDeletingDraft) return;
    setIsDeletingDraft(true);
    setShowDeleteDraftModal(false);
    try {
      await quizService.deleteQuiz(node.node_id, quiz.quiz_id);
      setQuiz(null);
      setQuizDraftExists(false);
      setCanAccessHints(false);
      setResolvedQuizId(null);
      onPageChangeRef.current(2);
      toast.success("Quiz draft deleted.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingDraft(false);
    }
  }, [node?.node_id, quiz, isDeletingDraft]);

  const handleDeleteHintsDraft = useCallback(async () => {
    if (!node || !quiz || isDeletingHintsDraft) return;
    setIsDeletingHintsDraft(true);
    setShowDeleteHintsModal(false);
    try {
      const updated = await quizService.deleteHintsDraft(node.node_id, quiz.quiz_id);
      setQuiz(updated);
      await refreshQuiz(updated.quiz_id);
      toast.success("Hints draft deleted.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingHintsDraft(false);
    }
  }, [node?.node_id, quiz, isDeletingHintsDraft, refreshQuiz]);

  const handlePublishQuiz = useCallback(async () => {
    if (!node || !quiz || isPublishing || !canPublishQuiz) return;
    setIsPublishing(true);
    try {
      const published = await quizService.publish(node.node_id, quiz.quiz_id);
      setQuiz(published);
      await refreshQuiz(published.quiz_id);
      toast.success("Quiz published for trainees.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsPublishing(false);
    }
  }, [node?.node_id, quiz, isPublishing, canPublishQuiz, refreshQuiz]);

  const handleUnpublishQuiz = useCallback(async () => {
    if (!node || !quiz || isUnpublishing) return;
    setIsUnpublishing(true);
    try {
      const unpublished = await quizService.unpublish(node.node_id, quiz.quiz_id);
      setQuiz(unpublished);
      await refreshQuiz(unpublished.quiz_id);
      toast.success("Quiz unpublished.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsUnpublishing(false);
    }
  }, [node?.node_id, quiz, isUnpublishing, refreshQuiz]);

  const handleUpdateQuestion = useCallback(async (questionId: string, data: QuizQuestionUpdateRequest) => {
    if (!node || !quiz) return;
    try {
      const updated = await quizService.updateQuestion(node.node_id, quiz.quiz_id, questionId, data);
      setQuiz((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => q.question_id === questionId ? updated : q),
        };
      });
      toast.success("Question updated.");
    } catch (err) {
      handleMutationError(err);
    }
  }, [node?.node_id, quiz]);

  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    if (!node || !quiz || isDeletingQuestion) return;
    setIsDeletingQuestion(questionId);
    try {
      await quizService.deleteQuestion(node.node_id, quiz.quiz_id, questionId);
      setQuiz((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.question_id === questionId ? { ...q, is_active: false } : q
          ),
        };
      });
      toast.success("Question removed.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingQuestion(null);
    }
  }, [node?.node_id, quiz, isDeletingQuestion]);

  const handleCreateQuestion = useCallback(async (data: QuizQuestionCreateRequest) => {
    if (!node || !quiz) return;
    try {
      const created = await quizService.createQuestion(node.node_id, quiz.quiz_id, data);
      setQuiz((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: [...prev.questions, created],
          total_questions: prev.total_questions + 1,
        };
      });
      toast.success("Question added.");
      await refreshQuiz(quiz.quiz_id);
    } catch (err) {
      handleMutationError(err);
    }
  }, [node?.node_id, quiz, refreshQuiz]);

  const handleReorderQuestions = useCallback(async (questionIds: string[]) => {
    if (!node || !quiz) return;
    try {
      await quizService.reorderQuestions(node.node_id, quiz.quiz_id, { question_ids: questionIds });
      setQuiz((prev) => {
        if (!prev) return prev;
        const ordered: typeof prev.questions = [];
        questionIds.forEach((id, idx) => {
          const q = prev.questions.find((q) => q.question_id === id);
          if (q) ordered.push({ ...q, order_index: idx });
        });
        prev.questions.forEach((q) => {
          if (!questionIds.includes(q.question_id)) ordered.push(q);
        });
        return { ...prev, questions: ordered };
      });
    } catch (err) {
      handleMutationError(err);
    }
  }, [node?.node_id, quiz]);

  const handleGenerateHints = useCallback(async () => {
    if (!node || !quiz || isGeneratingHints || !canGenerateHints) return;
    setIsGeneratingHints(true);
    try {
      const updated = await quizService.generateHints(node.node_id, quiz.quiz_id);
      setQuiz(updated);
      await refreshQuiz(quiz.quiz_id);
      toast.success("Hints generated for all questions.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsGeneratingHints(false);
    }
  }, [node?.node_id, quiz, isGeneratingHints, canGenerateHints, refreshQuiz]);

  const handleRegenerateAllHints = useCallback(async () => {
    if (!node || !quiz || isGeneratingHints || !canRegenerateHints) return;
    const questionIds = quiz.questions
      .filter((q) => q.is_active)
      .map((q) => q.question_id);
    if (questionIds.length === 0) return;

    setIsGeneratingHints(true);
    try {
      const updated = await quizService.regenerateHints(node.node_id, quiz.quiz_id, {
        question_ids: questionIds,
      });
      setQuiz(updated);
      await refreshQuiz(quiz.quiz_id);
      toast.success("Hints regenerated for all questions.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsGeneratingHints(false);
    }
  }, [node?.node_id, quiz, isGeneratingHints, canRegenerateHints, refreshQuiz]);

  const handleRegenerateHints = useCallback(async (questionId: string, feedback?: string) => {
    if (!node || !quiz || isGeneratingHints || hintsLocked) return;
    setIsGeneratingHints(true);
    try {
      const updated = await quizService.regenerateHints(node.node_id, quiz.quiz_id, {
        question_ids: [questionId],
        mentor_feedback: feedback?.trim() || undefined,
      });
      setQuiz(updated);
      await refreshQuiz(quiz.quiz_id);
      toast.success("Hints regenerated.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsGeneratingHints(false);
    }
  }, [node?.node_id, quiz, isGeneratingHints, hintsLocked, refreshQuiz]);

  const handleProceedToHints = useCallback(() => {
    if (!quiz) return;
    onPageChangeRef.current(4);
  }, [quiz]);

  const dismissStaleTabPrompt = useCallback(() => setShowStaleTabPrompt(false), []);
  const refreshQuizPage = useCallback(() => {
    setShowStaleTabPrompt(false);
    window.location.reload();
  }, []);

  return {
    quiz,
    isLoadingQuiz,
    isGenerating,
    isGeneratingHints,
    isPublishing,
    isUnpublishing,
    isDeletingDraft,
    isDeletingHintsDraft,
    isDeletingQuestion,
    quizDraftExists,
    canGenerateQuiz,
    generateDisabledTooltip,
    canPublishQuiz,
    publishDisabledTooltip,
    canAccessHints,
    hintsLocked,
    hintsLockedTooltip,
    canGenerateHints,
    canRegenerateHints,
    isLinkedVersionPublished,
    isStaleVersion,
    staleHelperText,
    generateNewQuizCtaLabel,
    quizTitleWithVersion,
    canEditQuestions,
    canRegenerateQuiz,
    editQuestionDisabledTooltip,
    regenerateQuizDisabledTooltip,
    showStaleTabPrompt,
    dismissStaleTabPrompt,
    refreshQuizPage,
    questionCount,
    setQuestionCount,
    difficulty,
    setDifficulty,
    showAnswerKey,
    setShowAnswerKey,
    showRegenerateModal,
    setShowRegenerateModal,
    showDeleteDraftModal,
    setShowDeleteDraftModal,
    showDeleteHintsModal,
    setShowDeleteHintsModal,
    handleGenerate,
    handleRegenerate,
    handleDeleteDraft,
    handleDeleteHintsDraft,
    handlePublishQuiz,
    handleUnpublishQuiz,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleCreateQuestion,
    handleReorderQuestions,
    handleGenerateHints,
    handleRegenerateAllHints,
    handleRegenerateHints,
    handleProceedToHints,
  };
}
