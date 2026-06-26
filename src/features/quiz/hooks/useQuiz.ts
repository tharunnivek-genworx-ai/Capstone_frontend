// src/features/quiz/hooks/useQuiz.ts
import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { TopicContentPage } from "../../spaces/types/node.types";
import type { NodeStudyStatePatch } from "../../study_material/types/studyMaterial.types";
import type {
  QuizDifficulty,
  QuizHistoryItemOut,
  QuizMentorUiStateOut,
  QuizOut,
  QuizQuestionCreateRequest,
  QuizQuestionUpdateRequest,
  QuizUnpublishPreviewOut,
  RetentionMode,
} from "../types/quiz.types";
import { quizService } from "../services/quizService";

/** Nodes with an in-flight quiz generate/regenerate request (survives node switches). */
const generatingQuizNodeIds = new Set<string>();
/** Nodes with an in-flight hints generate/regenerate request (survives node switches). */
const generatingHintsNodeIds = new Set<string>();

interface UseQuizParams {
  node: NodeTreeNode | null;
  isMentor: boolean;
  spaceIsPublished?: boolean;
  currentPage: TopicContentPage;
  canAccessQuiz: boolean;
  currentQuizId: string | null;
  isGeneratingQuiz: boolean;
  isGeneratingHints: boolean;
  onNodeStudyStateChange?: (nodeId: string, patch: NodeStudyStatePatch) => void;
  onPageChange: (page: TopicContentPage) => void;
  onMentorProgressRefresh?: () => void;
  contentRefreshToken?: number;
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
  quizHistory: QuizHistoryItemOut[];
  canGenerateQuiz: boolean;
  generateDisabledTooltip: string | null;
  canPublishQuiz: boolean;
  publishDisabledTooltip: string | null;
  publishQuizButtonLabel: string;
  unpublishQuizButtonLabel: string;
  hasOtherLiveQuiz: boolean;
  otherLiveQuizTitle: string | null;
  canAccessHints: boolean;
  hintsLocked: boolean;
  hintsLockedTooltip: string | null;
  canGenerateHints: boolean;
  canRegenerateHints: boolean;
  showUpdateQuizNudge: boolean;
  quizSmVersionLabel: string | null;
  canEditQuestions: boolean;
  canRegenerateQuiz: boolean;

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
  showPublishConfirmModal: boolean;
  setShowPublishConfirmModal: (v: boolean) => void;
  quizUnpublishPreview: QuizUnpublishPreviewOut | null;
  closeUnpublishQuizModal: () => void;

  // handlers
  handleGenerate: () => Promise<void>;
  handleRegenerate: (feedback: string) => Promise<void>;
  handleDeleteDraft: () => Promise<void>;
  handleDeleteHintsDraft: () => Promise<void>;
  handlePublishQuiz: () => void;
  confirmPublishQuiz: () => Promise<void>;
  handleUnpublishQuiz: () => Promise<void>;
  confirmUnpublishQuiz: (retentionMode: RetentionMode) => Promise<void>;
  handleUpdateQuestion: (questionId: string, data: QuizQuestionUpdateRequest) => Promise<void>;
  handleDeleteQuestion: (questionId: string) => Promise<void>;
  handleCreateQuestion: (data: QuizQuestionCreateRequest) => Promise<void>;
  handleReorderQuestions: (questionIds: string[]) => Promise<void>;
  handleGenerateHints: () => Promise<void>;
  handleRegenerateAllHints: () => Promise<void>;
  handleRegenerateHints: (questionId: string, feedback?: string) => Promise<void>;
  handleProceedToHints: () => void;
  handleViewHistoryQuiz: (quizId: string) => Promise<void>;
  handleCloseHistoryView: () => void;
  handleDeleteHistoryQuiz: (quizId: string) => Promise<void>;
  isViewingHistoryQuiz: boolean;
  isLoadingHistoryQuiz: boolean;
  historyQuiz: QuizOut | null;
  viewingHistoryItem: QuizHistoryItemOut | null;
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
    setPublishQuizButtonLabel: (v: string) => void;
    setUnpublishQuizButtonLabel: (v: string) => void;
    setHasOtherLiveQuiz: (v: boolean) => void;
    setOtherLiveQuizTitle: (v: string | null) => void;
    setCanEditQuestions: (v: boolean) => void;
    setCanRegenerateQuiz: (v: boolean) => void;
    setQuiz: (v: QuizOut | null) => void;
    setShowUpdateQuizNudge: (v: boolean) => void;
    setQuizSmVersionLabel: (v: string | null) => void;
    setQuizHistory: (v: QuizHistoryItemOut[]) => void;
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
  setters.setPublishQuizButtonLabel(state.publish_quiz_button_label ?? "Make quiz live for students");
  setters.setUnpublishQuizButtonLabel(state.unpublish_quiz_button_label ?? "Remove quiz from students");
  setters.setHasOtherLiveQuiz(state.has_other_live_quiz ?? false);
  setters.setOtherLiveQuizTitle(state.other_live_quiz_title ?? null);
  setters.setCanEditQuestions(state.can_edit_questions);
  setters.setCanRegenerateQuiz(state.can_regenerate_quiz);
  setters.setShowUpdateQuizNudge(state.show_update_quiz_nudge ?? false);
  setters.setQuizSmVersionLabel(state.quiz_sm_version_label ?? null);
  setters.setQuizHistory(state.quiz_history ?? []);
  if (options.includeQuiz) {
    setters.setQuiz(state.resolved_quiz_id ? state.quiz ?? null : null);
  }
}

export function useQuiz({
  node,
  isMentor,
  spaceIsPublished,
  currentPage,
  canAccessQuiz,
  currentQuizId,
  isGeneratingQuiz,
  isGeneratingHints,
  onNodeStudyStateChange,
  onPageChange,
  onMentorProgressRefresh,
  contentRefreshToken = 0,
}: UseQuizParams): UseQuizReturn {
  const [quiz, setQuiz] = useState<QuizOut | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
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
  const [publishQuizButtonLabel, setPublishQuizButtonLabel] = useState("Make quiz live for students");
  const [unpublishQuizButtonLabel, setUnpublishQuizButtonLabel] = useState("Remove quiz from students");
  const [hasOtherLiveQuiz, setHasOtherLiveQuiz] = useState(false);
  const [otherLiveQuizTitle, setOtherLiveQuizTitle] = useState<string | null>(null);
  const [canAccessHints, setCanAccessHints] = useState(false);
  const [hintsLocked, setHintsLocked] = useState(false);
  const [hintsLockedTooltip, setHintsLockedTooltip] = useState<string | null>(null);
  const [canGenerateHints, setCanGenerateHints] = useState(false);
  const [canRegenerateHints, setCanRegenerateHints] = useState(false);
  const [showUpdateQuizNudge, setShowUpdateQuizNudge] = useState(false);
  const [quizSmVersionLabel, setQuizSmVersionLabel] = useState<string | null>(null);
  const [canEditQuestions, setCanEditQuestions] = useState(false);
  const [canRegenerateQuiz, setCanRegenerateQuiz] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItemOut[]>([]);
  const [viewingHistoryQuizId, setViewingHistoryQuizId] = useState<string | null>(null);
  const [historyQuiz, setHistoryQuiz] = useState<QuizOut | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<QuizHistoryItemOut | null>(null);
  const [isLoadingHistoryQuiz, setIsLoadingHistoryQuiz] = useState(false);
  const viewingHistoryRef = useRef<string | null>(null);

  const handleMutationError = useCallback((err: unknown) => {
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
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const [quizUnpublishPreview, setQuizUnpublishPreview] = useState<QuizUnpublishPreviewOut | null>(null);

  const nodeIdRef = useRef<string | null>(null);
  const onNodeStudyStateChangeRef = useRef(onNodeStudyStateChange);
  onNodeStudyStateChangeRef.current = onNodeStudyStateChange;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const onMentorProgressRefreshRef = useRef(onMentorProgressRefresh);
  onMentorProgressRefreshRef.current = onMentorProgressRefresh;
  const currentNodeIdRef = useRef(node?.node_id);
  currentNodeIdRef.current = node?.node_id;
  const currentQuizIdRef = useRef(currentQuizId);
  currentQuizIdRef.current = currentQuizId;
  const syncGenerationRef = useRef(0);

  const isViewingNode = (nodeId: string) => currentNodeIdRef.current === nodeId;

  const patchNodeStudyState = useCallback((nodeId: string, patch: NodeStudyStatePatch) => {
    onNodeStudyStateChangeRef.current?.(nodeId, patch);
  }, []);

  const setResolvedQuizIdForNode = useCallback((nodeId: string, quizId: string | null) => {
    patchNodeStudyState(nodeId, { currentQuizId: quizId });
    if (isViewingNode(nodeId)) {
      currentQuizIdRef.current = quizId;
    }
  }, [patchNodeStudyState]);

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
    setPublishQuizButtonLabel,
    setUnpublishQuizButtonLabel,
    setHasOtherLiveQuiz,
    setOtherLiveQuizTitle,
    setCanEditQuestions,
    setCanRegenerateQuiz,
    setQuiz,
    setShowUpdateQuizNudge,
    setQuizSmVersionLabel,
    setQuizHistory,
  };

  // Reset when node changes
  useEffect(() => {
    if (!node) return;
    if (nodeIdRef.current === node.node_id) return;
    nodeIdRef.current = node.node_id;
    setQuiz(null);
    setIsLoadingQuiz(false);
    setIsPublishing(false);
    setIsUnpublishing(false);
    setIsDeletingDraft(false);
    setIsDeletingHintsDraft(false);
    setShowAnswerKey(false);
    setShowRegenerateModal(false);
    setShowDeleteDraftModal(false);
    setShowDeleteHintsModal(false);
    setShowPublishConfirmModal(false);
    setQuizUnpublishPreview(null);
    setQuizDraftExists(false);
    setCanGenerateQuiz(false);
    setGenerateDisabledTooltip(null);
    setCanPublishQuiz(false);
    setPublishDisabledTooltip(null);
    setPublishQuizButtonLabel("Make quiz live for students");
    setUnpublishQuizButtonLabel("Remove quiz from students");
    setHasOtherLiveQuiz(false);
    setOtherLiveQuizTitle(null);
    setCanAccessHints(false);
    setHintsLocked(false);
    setHintsLockedTooltip(null);
    setCanGenerateHints(false);
    setCanRegenerateHints(false);
    setShowUpdateQuizNudge(false);
    setCanEditQuestions(false);
    setCanRegenerateQuiz(false);
    setQuizHistory([]);
    setViewingHistoryQuizId(null);
    viewingHistoryRef.current = null;
    setHistoryQuiz(null);
    setViewingHistoryItem(null);
    setIsLoadingHistoryQuiz(false);
  }, [node?.node_id, handleMutationError]);

  // Keep generation settings aligned with the active draft.
  useEffect(() => {
    if (!quiz || viewingHistoryRef.current) return;
    setQuestionCount(quiz.total_questions);
    setDifficulty(quiz.difficulty);
  }, [quiz?.quiz_id, quiz?.total_questions, quiz?.difficulty]);

  // Sync mentor quiz state from the backend (resolution + optional full quiz load).
  useEffect(() => {
    if (!node || !canAccessQuiz || !isMentor) return;
    if (viewingHistoryRef.current) return;

    let cancelled = false;
    const generation = ++syncGenerationRef.current;

    const syncQuiz = async () => {
      try {
        // Skip full quiz payload only while a brand-new quiz is being generated.
        // Hints generation still needs the existing quiz loaded on page 4.
        const includeQuiz =
          (currentPage === 3 || currentPage === 4) && !isGeneratingQuiz;

        const state = await quizService.getMentorUiState(node.node_id, {
          preferredQuizId: currentQuizIdRef.current,
          includeQuiz,
        });
        if (cancelled || generation !== syncGenerationRef.current) return;

        applyMentorUiState(state, mentorStateSetters, { includeQuiz });

        if (state.resolved_quiz_id !== currentQuizIdRef.current) {
          setResolvedQuizIdForNode(node.node_id, state.resolved_quiz_id);
        }
      } catch (err) {
        if (cancelled || generation !== syncGenerationRef.current) return;
        handleMutationError(err);
        setQuiz(null);
        setResolvedQuizIdForNode(node.node_id, null);
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
    isGeneratingQuiz,
    isGeneratingHints,
    spaceIsPublished,
    handleMutationError,
    setResolvedQuizIdForNode,
  ]);

  const refreshQuiz = useCallback(async (nodeId: string, preferredQuizId?: string | null) => {
    if (!isViewingNode(nodeId)) return;
    const preferred = preferredQuizId !== undefined ? preferredQuizId : currentQuizIdRef.current;
    const generation = ++syncGenerationRef.current;
    try {
      const state = await quizService.getMentorUiState(nodeId, {
        preferredQuizId: preferred,
        includeQuiz: true,
      });
      if (generation !== syncGenerationRef.current || !isViewingNode(nodeId)) return;
      applyMentorUiState(state, mentorStateSetters, { includeQuiz: true });
      if (state.resolved_quiz_id !== preferred) {
        setResolvedQuizIdForNode(nodeId, state.resolved_quiz_id);
      }
    } catch (err) {
      if (generation !== syncGenerationRef.current || !isViewingNode(nodeId)) return;
      handleMutationError(err);
    }
  }, [handleMutationError, setResolvedQuizIdForNode]);

  // Refresh after content is published from the espace republish checklist modal.
  useEffect(() => {
    if (!node || !isMentor || contentRefreshToken === 0) return;
    void refreshQuiz(node.node_id, currentQuizIdRef.current);
  }, [contentRefreshToken, node?.node_id, isMentor, refreshQuiz]);

  // Recover stale quiz-generation flags when returning to a node whose request
  // finished while another node was selected.
  useEffect(() => {
    if (!node || !isMentor || !isGeneratingQuiz) return;
    if (currentPage !== 3 && currentPage !== 4) return;
    if (generatingQuizNodeIds.has(node.node_id)) return;

    const nodeId = node.node_id;
    let cancelled = false;
    quizService
      .getMentorUiState(nodeId, { preferredQuizId: currentQuizId, includeQuiz: true })
      .then((state) => {
        if (cancelled) return;
        patchNodeStudyState(nodeId, {
          isGeneratingQuiz: false,
          currentQuizId: state.resolved_quiz_id,
        });
        if (isViewingNode(nodeId)) {
          applyMentorUiState(state, mentorStateSetters, { includeQuiz: true });
        }
      })
      .catch(() => {
        if (cancelled) return;
        patchNodeStudyState(nodeId, { isGeneratingQuiz: false });
      });
    return () => {
      cancelled = true;
    };
  }, [node?.node_id, isMentor, isGeneratingQuiz, currentPage, currentQuizId, patchNodeStudyState]);

  // Recover stale hints-generation flags the same way.
  useEffect(() => {
    if (!node || !isMentor || !isGeneratingHints) return;
    if (currentPage !== 4) return;
    if (generatingHintsNodeIds.has(node.node_id)) return;

    const nodeId = node.node_id;
    let cancelled = false;
    quizService
      .getMentorUiState(nodeId, {
        preferredQuizId: currentQuizId,
        includeQuiz: true,
      })
      .then((state) => {
        if (cancelled) return;
        patchNodeStudyState(nodeId, { isGeneratingHints: false, currentQuizId: state.resolved_quiz_id });
        if (isViewingNode(nodeId)) {
          applyMentorUiState(state, mentorStateSetters, { includeQuiz: true });
        }
      })
      .catch(() => {
        if (cancelled) return;
        patchNodeStudyState(nodeId, { isGeneratingHints: false });
      });
    return () => {
      cancelled = true;
    };
  }, [node?.node_id, isMentor, isGeneratingHints, currentPage, currentQuizId, patchNodeStudyState]);

  const handleGenerate = useCallback(async () => {
    if (!node || isGeneratingQuiz || !canGenerateQuiz) return;
    const nodeId = node.node_id;
    generatingQuizNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, { isGeneratingQuiz: true });
    try {
      const generated = await quizService.generate(nodeId, {
        difficulty,
        question_count: questionCount,
        mode: "generate",
      });
      setResolvedQuizIdForNode(nodeId, generated.quiz_id);
      patchNodeStudyState(nodeId, { isGeneratingQuiz: false });
      if (isViewingNode(nodeId)) {
        setQuiz(generated);
        await refreshQuiz(nodeId, generated.quiz_id);
      }
      toast.success("Quiz draft generated successfully.");
    } catch (err) {
      patchNodeStudyState(nodeId, { isGeneratingQuiz: false });
      handleMutationError(err);
    } finally {
      generatingQuizNodeIds.delete(nodeId);
    }
  }, [node, canGenerateQuiz, difficulty, questionCount, isGeneratingQuiz, refreshQuiz, patchNodeStudyState, setResolvedQuizIdForNode, handleMutationError]);

  const handleRegenerate = useCallback(async (feedback: string) => {
    if (!node || !quiz || isGeneratingQuiz || !canGenerateQuiz) return;
    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingQuizNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, { isGeneratingQuiz: true });
    if (isViewingNode(nodeId)) {
      setShowRegenerateModal(false);
    }
    try {
      const generated = await quizService.generate(nodeId, {
        difficulty,
        question_count: questionCount,
        mode: "regenerate",
        quiz_id: quizId,
        mentor_feedback: feedback || undefined,
      });
      setResolvedQuizIdForNode(nodeId, generated.quiz_id);
      patchNodeStudyState(nodeId, { isGeneratingQuiz: false });
      if (isViewingNode(nodeId)) {
        setQuiz(generated);
        await refreshQuiz(nodeId, generated.quiz_id);
      }
      toast.success("Quiz regenerated successfully.");
    } catch (err) {
      patchNodeStudyState(nodeId, { isGeneratingQuiz: false });
      handleMutationError(err);
    } finally {
      generatingQuizNodeIds.delete(nodeId);
    }
  }, [node, canGenerateQuiz, quiz, questionCount, difficulty, isGeneratingQuiz, refreshQuiz, patchNodeStudyState, setResolvedQuizIdForNode, handleMutationError]);

  const handleDeleteDraft = useCallback(async () => {
    if (!node || !quiz || isDeletingDraft) return;
    const nodeId = node.node_id;
    setIsDeletingDraft(true);
    setShowDeleteDraftModal(false);
    try {
      await quizService.deleteQuiz(nodeId, quiz.quiz_id);
      setQuiz(null);
      setQuizDraftExists(false);
      setCanAccessHints(false);
      setResolvedQuizIdForNode(nodeId, null);
      await refreshQuiz(nodeId, null);
      toast.success("Quiz draft deleted.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingDraft(false);
    }
  }, [node, quiz, isDeletingDraft, setResolvedQuizIdForNode, refreshQuiz, handleMutationError]);

  const handleDeleteHintsDraft = useCallback(async () => {
    if (!node || !quiz || isDeletingHintsDraft) return;
    const nodeId = node.node_id;
    setIsDeletingHintsDraft(true);
    setShowDeleteHintsModal(false);
    try {
      const updated = await quizService.deleteHintsDraft(nodeId, quiz.quiz_id);
      setQuiz(updated);
      await refreshQuiz(nodeId, updated.quiz_id);
      toast.success("Hints draft deleted.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingHintsDraft(false);
    }
  }, [node, quiz, isDeletingHintsDraft, refreshQuiz, handleMutationError]);

  const confirmPublishQuiz = useCallback(async () => {
    if (!node || !quiz || isPublishing || !canPublishQuiz) return;
    const nodeId = node.node_id;
    setIsPublishing(true);
    try {
      const published = await quizService.publish(nodeId, quiz.quiz_id);
      setQuiz(published);
      setShowPublishConfirmModal(false);
      await refreshQuiz(nodeId, published.quiz_id);
      onMentorProgressRefreshRef.current?.();
      toast.success("Quiz is now live for students.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsPublishing(false);
    }
  }, [node, quiz, isPublishing, canPublishQuiz, refreshQuiz, handleMutationError]);

  const handlePublishQuiz = useCallback(() => {
    if (!node || !quiz || isPublishing || !canPublishQuiz || quiz.is_published) return;
    if (hasOtherLiveQuiz) {
      setShowPublishConfirmModal(true);
      return;
    }
    void confirmPublishQuiz();
  }, [node, quiz, isPublishing, canPublishQuiz, hasOtherLiveQuiz, confirmPublishQuiz]);

  const handleUnpublishQuiz = useCallback(async () => {
    if (!node || !quiz || isUnpublishing || !quiz.is_published) return;
    try {
      const preview = await quizService.previewUnpublish(node.node_id, quiz.quiz_id);
      setQuizUnpublishPreview(preview);
    } catch (err) {
      handleMutationError(err);
    }
  }, [node, quiz, isUnpublishing, handleMutationError]);

  const closeUnpublishQuizModal = useCallback(() => {
    if (isUnpublishing) return;
    setQuizUnpublishPreview(null);
  }, [isUnpublishing]);

  const confirmUnpublishQuiz = useCallback(async (retentionMode: RetentionMode) => {
    if (!node || !quiz || isUnpublishing) return;
    const nodeId = node.node_id;
    setIsUnpublishing(true);
    try {
      const unpublished = await quizService.unpublish(nodeId, quiz.quiz_id, {
        retention_mode: retentionMode,
      });
      setQuiz(unpublished);
      setQuizUnpublishPreview(null);
      await refreshQuiz(nodeId, unpublished.quiz_id);
      onMentorProgressRefreshRef.current?.();
      toast.success("Quiz removed from students.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsUnpublishing(false);
    }
  }, [node, quiz, isUnpublishing, refreshQuiz, handleMutationError]);

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
      await refreshQuiz(node.node_id, quiz.quiz_id);
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
    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingHintsNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, { isGeneratingHints: true });
    try {
      const updated = await quizService.generateHints(nodeId, quizId);
      patchNodeStudyState(nodeId, { isGeneratingHints: false });
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        await refreshQuiz(nodeId, quizId);
      }
      toast.success("Hints generated for all questions.");
    } catch (err) {
      patchNodeStudyState(nodeId, { isGeneratingHints: false });
      handleMutationError(err);
    } finally {
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [node, quiz, isGeneratingHints, canGenerateHints, refreshQuiz, patchNodeStudyState, handleMutationError]);

  const handleRegenerateAllHints = useCallback(async () => {
    if (!node || !quiz || isGeneratingHints || !canRegenerateHints) return;
    const questionIds = quiz.questions
      .filter((q) => q.is_active)
      .map((q) => q.question_id);
    if (questionIds.length === 0) return;

    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingHintsNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, { isGeneratingHints: true });
    try {
      const updated = await quizService.regenerateHints(nodeId, quizId, {
        question_ids: questionIds,
      });
      patchNodeStudyState(nodeId, { isGeneratingHints: false });
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        await refreshQuiz(nodeId, quizId);
      }
      toast.success("Hints regenerated for all questions.");
    } catch (err) {
      patchNodeStudyState(nodeId, { isGeneratingHints: false });
      handleMutationError(err);
    } finally {
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [node, quiz, isGeneratingHints, canRegenerateHints, refreshQuiz, patchNodeStudyState, handleMutationError]);

  const handleRegenerateHints = useCallback(async (questionId: string, feedback?: string) => {
    if (!node || !quiz || isGeneratingHints || hintsLocked) return;
    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingHintsNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, { isGeneratingHints: true });
    try {
      const updated = await quizService.regenerateHints(nodeId, quizId, {
        question_ids: [questionId],
        mentor_feedback: feedback?.trim() || undefined,
      });
      patchNodeStudyState(nodeId, { isGeneratingHints: false });
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        await refreshQuiz(nodeId, quizId);
      }
      toast.success("Hints regenerated.");
    } catch (err) {
      patchNodeStudyState(nodeId, { isGeneratingHints: false });
      handleMutationError(err);
    } finally {
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [node, quiz, isGeneratingHints, hintsLocked, refreshQuiz, patchNodeStudyState, handleMutationError]);

  const handleProceedToHints = useCallback(() => {
    if (!quiz) return;
    onPageChangeRef.current(4);
  }, [quiz]);

  const handleViewHistoryQuiz = useCallback(async (quizId: string) => {
    if (!node) return;
    const item = quizHistory.find((entry) => entry.quiz_id === quizId) ?? null;
    setViewingHistoryQuizId(quizId);
    viewingHistoryRef.current = quizId;
    setViewingHistoryItem(item);
    setHistoryQuiz(null);
    setIsLoadingHistoryQuiz(true);
    setShowAnswerKey(false);
    try {
      const loaded = await quizService.getQuiz(node.node_id, quizId);
      if (viewingHistoryRef.current !== quizId) return;
      setHistoryQuiz(loaded);
    } catch (err) {
      if (viewingHistoryRef.current !== quizId) return;
      handleMutationError(err);
      viewingHistoryRef.current = null;
      setViewingHistoryQuizId(null);
      setViewingHistoryItem(null);
    } finally {
      if (viewingHistoryRef.current === quizId) {
        setIsLoadingHistoryQuiz(false);
      }
    }
  }, [node?.node_id, quizHistory, handleMutationError]);

  const handleCloseHistoryView = useCallback(() => {
    viewingHistoryRef.current = null;
    setViewingHistoryQuizId(null);
    setHistoryQuiz(null);
    setViewingHistoryItem(null);
    setIsLoadingHistoryQuiz(false);
    setShowAnswerKey(false);
    if (node) {
      void refreshQuiz(node.node_id, null);
    }
  }, [node, refreshQuiz]);

  const handleDeleteHistoryQuiz = useCallback(async (quizId: string) => {
    if (!node || isDeletingDraft) return;
    const nodeId = node.node_id;
    setIsDeletingDraft(true);
    try {
      await quizService.deleteQuiz(nodeId, quizId);
      toast.success("Quiz removed from history.");
      if (viewingHistoryRef.current === quizId) {
        handleCloseHistoryView();
      }
      await refreshQuiz(nodeId, null);
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingDraft(false);
    }
  }, [node, isDeletingDraft, refreshQuiz, handleMutationError, handleCloseHistoryView]);

  return {
    quiz,
    isLoadingQuiz,
    isGenerating: isGeneratingQuiz,
    isGeneratingHints,
    isPublishing,
    isUnpublishing,
    isDeletingDraft,
    isDeletingHintsDraft,
    isDeletingQuestion,
    quizDraftExists,
    quizHistory,
    canGenerateQuiz,
    generateDisabledTooltip,
    canPublishQuiz,
    publishDisabledTooltip,
    publishQuizButtonLabel,
    unpublishQuizButtonLabel,
    hasOtherLiveQuiz,
    otherLiveQuizTitle,
    canAccessHints,
    hintsLocked,
    hintsLockedTooltip,
    canGenerateHints,
    canRegenerateHints,
    showUpdateQuizNudge,
    quizSmVersionLabel,
    canEditQuestions,
    canRegenerateQuiz,
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
    showPublishConfirmModal,
    setShowPublishConfirmModal,
    quizUnpublishPreview,
    closeUnpublishQuizModal,
    handleGenerate,
    handleRegenerate,
    handleDeleteDraft,
    handleDeleteHintsDraft,
    handlePublishQuiz,
    confirmPublishQuiz,
    handleUnpublishQuiz,
    confirmUnpublishQuiz,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleCreateQuestion,
    handleReorderQuestions,
    handleGenerateHints,
    handleRegenerateAllHints,
    handleRegenerateHints,
    handleProceedToHints,
    handleViewHistoryQuiz,
    handleCloseHistoryView,
    handleDeleteHistoryQuiz,
    isViewingHistoryQuiz: viewingHistoryQuizId !== null,
    isLoadingHistoryQuiz,
    historyQuiz,
    viewingHistoryItem,
  };
}
