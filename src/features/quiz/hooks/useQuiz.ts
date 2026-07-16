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
import { generationJobService } from "../../generation/services/generationProgressService";
import type {
  GenerationPipeline,
  GenerationProgressOut,
} from "../../generation/types/generationProgress.types";
import {
  patchClearFailedGenerationRun,
  patchForGenerationJobAbandoned,
  patchForGenerationJobFailure,
  patchForGenerationJobPaused,
  patchForGenerationJobStart,
  patchForGenerationJobSuccess,
  patchGenerationProgressUpdate,
} from "../../generation/utils/generationRunState";
import {
  extractResumeErrorDetail,
  GenerationJobFailedError,
} from "../../generation/utils/generationJobErrors";

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
  generationProgressSessionId: string | null;
  activeGenerationRunId: string | null;
  generationProgress?: GenerationProgressOut | null;
  generationRunFailed: boolean;
  generationRunPaused?: boolean;
  failedGenerationPipeline: GenerationPipeline | null;
  isPausingGeneration?: boolean;
  isAbandoningGeneration?: boolean;
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
  generationProgressSessionId: string | null;
  activeGenerationRunId: string | null;
  generationProgress: GenerationProgressOut | null;
  generationRunFailed: boolean;
  generationRunPaused: boolean;
  failedGenerationPipeline: GenerationPipeline | null;
  isResumingFailedGeneration: boolean;
  isPausingGeneration: boolean;
  isAbandoningGeneration: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeletingDraft: boolean;
  isDeletingHintsDraft: boolean;
  isDeletingQuestion: string | null;
  isRegeneratingQuestion: string | null;
  hintsStaleQuestionIds: string[];
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
  handleGenerate: (questionCountOverride?: number) => Promise<void>;
  handlePauseGeneration: () => Promise<void>;
  handleAbandonGeneration: () => Promise<void>;
  handleResumeFailedGeneration: () => Promise<void>;
  handleRegenerate: (feedback: string, questionCountOverride?: number) => Promise<void>;
  handleDeleteDraft: () => Promise<void>;
  handleDeleteHintsDraft: () => Promise<void>;
  handlePublishQuiz: () => void;
  confirmPublishQuiz: () => Promise<void>;
  handleUnpublishQuiz: () => Promise<void>;
  confirmUnpublishQuiz: (retentionMode: RetentionMode) => Promise<void>;
  handleUpdateQuestion: (questionId: string, data: QuizQuestionUpdateRequest) => Promise<boolean>;
  handleDeleteQuestion: (questionId: string) => Promise<boolean>;
  handleRegenerateQuestion: (questionId: string, feedback: string) => Promise<boolean>;
  handleCreateQuestion: (data: QuizQuestionCreateRequest) => Promise<boolean>;
  handleReorderQuestions: (questionIds: string[]) => Promise<void>;
  handleGenerateHints: () => Promise<void>;
  handleRegenerateAllHints: (feedback: string) => Promise<boolean>;
  handleRegenerateHints: (questionId: string, feedback?: string) => Promise<boolean>;
  handleProceedToHints: () => void;
  handleViewHistoryQuiz: (quizId: string) => Promise<void>;
  handleCloseHistoryView: () => void;
  handleDeleteHistoryQuiz: (quizId: string) => Promise<void>;
  handleAcceptFailedQc: () => Promise<void>;
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

function retainQuestionsWithIncompleteHints(
  questionIds: string[],
  quiz: QuizOut,
): string[] {
  return questionIds.filter((questionId) => {
    const question = quiz.questions.find((item) => item.question_id === questionId);
    return !question?.hint_1 || !question.hint_2 || !question.hint_3;
  });
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
  generationProgressSessionId,
  activeGenerationRunId = null,
  generationProgress = null,
  generationRunFailed = false,
  generationRunPaused = false,
  failedGenerationPipeline = null,
  isPausingGeneration = false,
  isAbandoningGeneration = false,
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
  const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState<string | null>(null);
  const [isResumingFailedGeneration, setIsResumingFailedGeneration] = useState(false);
  const [hintsStaleQuestionIds, setHintsStaleQuestionIds] = useState<string[]>([]);
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

  useEffect(() => {
    const activeCount = quiz?.questions.filter((question) => question.is_active).length ?? 0;
    if (activeCount > 0) {
      setQuestionCount(activeCount);
    }
  }, [quiz?.quiz_id, quiz?.questions]);

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

  const settlePausedProgress = useCallback((
    progress: { status: string; session_id: string },
    pipeline: "quiz" | "hint",
    nodeId: string,
  ): boolean => {
    if (progress.status !== "paused") return false;
    patchNodeStudyState(
      nodeId,
      patchForGenerationJobPaused(progress.session_id, pipeline),
    );
    setIsRegeneratingQuestion(null);
    return true;
  }, [patchNodeStudyState]);

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
    setHintsStaleQuestionIds([]);
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

  const applyCompletedRunResult = useCallback(async (
    nodeId: string,
    pipeline: "quiz" | "hint",
    runId: string,
  ) => {
    const result = await generationJobService.getResult(runId);
    const updated = result.quiz as QuizOut | null | undefined;
    if (!updated) throw new Error("Generation completed without a quiz result.");
    if (pipeline === "quiz") {
      setResolvedQuizIdForNode(nodeId, updated.quiz_id);
    }
    patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
    if (isViewingNode(nodeId)) {
      setQuiz(updated);
      if (pipeline === "hint") {
        setHintsStaleQuestionIds((previous) => retainQuestionsWithIncompleteHints(previous, updated));
      }
      await refreshQuiz(nodeId, updated.quiz_id);
    }
  }, [patchNodeStudyState, refreshQuiz, setResolvedQuizIdForNode]);

  // Refresh after content is published from the espace republish checklist modal.
  useEffect(() => {
    if (!node || !isMentor || contentRefreshToken === 0) return;
    void refreshQuiz(node.node_id, currentQuizIdRef.current);
  }, [contentRefreshToken, node?.node_id, isMentor, refreshQuiz]);

  // Recover polling when returning to a node with an in-flight or resumable quiz generation run.
  useEffect(() => {
    if (!node || !isMentor) return;
    if (currentPage !== 3 && currentPage !== 4) return;
    if (generatingQuizNodeIds.has(node.node_id)) return;
    if (generationProgressSessionId && isGeneratingQuiz) return;
    if (generationRunFailed && failedGenerationPipeline === "quiz") return;
    if (generationRunPaused && failedGenerationPipeline === "quiz") return;

    const nodeId = node.node_id;
    const resourceId = currentQuizId ?? nodeId;
    let cancelled = false;

    generationJobService
      .getActiveRun(resourceId, "quiz")
      .then(async (active) => {
        if (cancelled) return;
        if (!active?.run_id) {
          if (isGeneratingQuiz) {
            patchNodeStudyState(nodeId, {
              isGeneratingQuiz: false,
              ...patchClearFailedGenerationRun(),
            });
          }
          return;
        }
        const runId = active.run_id;
        if (active.status === "failed") {
          patchNodeStudyState(nodeId, {
            ...patchForGenerationJobFailure(
              new GenerationJobFailedError("Generation failed.", runId),
              runId,
              "quiz",
            ),
          });
          return;
        }
        if (active.status === "paused") {
          patchNodeStudyState(
            nodeId,
            patchForGenerationJobPaused(runId, "quiz"),
          );
          return;
        }
        patchNodeStudyState(nodeId, {
          isGeneratingQuiz: true,
          generationRunFailed: false,
          failedGenerationPipeline: null,
          generationProgressSessionId: runId,
          activeGenerationRunId: runId,
        });
        let resumableFailure = false;
        try {
          const progress = await generationJobService.waitForCompletion(runId);
          if (settlePausedProgress(progress, "quiz", nodeId)) {
            resumableFailure = true;
            return;
          }
          const result = await generationJobService.getResult(runId);
          const generated = result.quiz as QuizOut | null | undefined;
          if (generated) {
            setResolvedQuizIdForNode(nodeId, generated.quiz_id);
            if (isViewingNode(nodeId)) {
              setQuiz(generated);
              await refreshQuiz(nodeId, generated.quiz_id);
            }
          }
          patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
        } catch (err) {
          const failure = patchForGenerationJobFailure(err, runId, "quiz");
          if (failure.generationRunFailed) {
            resumableFailure = true;
            patchNodeStudyState(nodeId, failure);
          }
        } finally {
          if (!cancelled && !resumableFailure) {
            patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
          }
        }
      })
      .catch(() => {/* non-critical */});

    return () => {
      cancelled = true;
    };
  }, [
    node?.node_id,
    isMentor,
    isGeneratingQuiz,
    currentPage,
    currentQuizId,
    generationProgressSessionId,
    generationRunFailed,
    generationRunPaused,
    failedGenerationPipeline,
    patchNodeStudyState,
    refreshQuiz,
    settlePausedProgress,
    setResolvedQuizIdForNode,
  ]);

  // Recover polling when returning to a node with an in-flight or resumable hint generation run.
  useEffect(() => {
    if (!node || !isMentor) return;
    if (currentPage !== 4) return;
    if (generatingHintsNodeIds.has(node.node_id)) return;
    if (generationProgressSessionId && isGeneratingHints) return;
    if (generationRunFailed && failedGenerationPipeline === "hint") return;
    if (generationRunPaused && failedGenerationPipeline === "hint") return;
    if (!currentQuizId) return;

    const nodeId = node.node_id;
    const quizId = currentQuizId;
    let cancelled = false;

    generationJobService
      .getActiveRun(quizId, "hint")
      .then(async (active) => {
        if (cancelled) return;
        if (!active?.run_id) {
          if (isGeneratingHints) {
            patchNodeStudyState(nodeId, {
              isGeneratingHints: false,
              ...patchClearFailedGenerationRun(),
            });
          }
          return;
        }
        const runId = active.run_id;
        if (active.status === "failed") {
          patchNodeStudyState(nodeId, {
            ...patchForGenerationJobFailure(
              new GenerationJobFailedError("Generation failed.", runId),
              runId,
              "hint",
            ),
          });
          return;
        }
        if (active.status === "paused") {
          patchNodeStudyState(
            nodeId,
            patchForGenerationJobPaused(runId, "hint"),
          );
          return;
        }
        patchNodeStudyState(nodeId, {
          isGeneratingHints: true,
          generationRunFailed: false,
          failedGenerationPipeline: null,
          generationProgressSessionId: runId,
          activeGenerationRunId: runId,
        });
        let resumableFailure = false;
        try {
          const progress = await generationJobService.waitForCompletion(runId);
          if (settlePausedProgress(progress, "hint", nodeId)) {
            resumableFailure = true;
            return;
          }
          const result = await generationJobService.getResult(runId);
          const updated = result.quiz as QuizOut | null | undefined;
          if (updated && isViewingNode(nodeId)) {
            setQuiz(updated);
            await refreshQuiz(nodeId, quizId);
          }
          patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
        } catch (err) {
          const failure = patchForGenerationJobFailure(err, runId, "hint");
          if (failure.generationRunFailed) {
            resumableFailure = true;
            patchNodeStudyState(nodeId, failure);
          }
        } finally {
          if (!cancelled && !resumableFailure) {
            patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
          }
        }
      })
      .catch(() => {/* non-critical */});

    return () => {
      cancelled = true;
    };
  }, [
    node?.node_id,
    isMentor,
    isGeneratingHints,
    currentPage,
    currentQuizId,
    generationProgressSessionId,
    generationRunFailed,
    generationRunPaused,
    failedGenerationPipeline,
    patchNodeStudyState,
    refreshQuiz,
    settlePausedProgress,
  ]);

  const handleGenerate = useCallback(async (questionCountOverride?: number) => {
    if (!node || isGeneratingQuiz || generationRunPaused || !canGenerateQuiz) return;
    const finalQuestionCount = questionCountOverride ?? questionCount;
    if (questionCountOverride !== undefined) {
      setQuestionCount(questionCountOverride);
    }
    const nodeId = node.node_id;
    generatingQuizNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      isGeneratingQuiz: true,
      ...patchForGenerationJobStart(),
    });
    try {
      const { result, progress, runId } = await generationJobService.runJob(
        () => quizService.startGenerate(nodeId, {
          difficulty,
          question_count: finalQuestionCount,
          mode: "generate",
        }),
        (progress) => {
          latestRunId = progress.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progress));
        },
      );
      if (settlePausedProgress(progress, "quiz", nodeId)) return;
      if (!result) throw new Error("Quiz generation completed without a result.");
      latestRunId = runId;
      const generated = result.quiz as QuizOut | null | undefined;
      if (!generated) throw new Error("Quiz generation returned no quiz.");
      setResolvedQuizIdForNode(nodeId, generated.quiz_id);
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      if (isViewingNode(nodeId)) {
        setQuiz(generated);
        await refreshQuiz(nodeId, generated.quiz_id);
      }
      toast.success("Quiz draft generated successfully.");
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, latestRunId, "quiz"));
      handleMutationError(err);
    } finally {
      generatingQuizNodeIds.delete(nodeId);
    }
  }, [node, canGenerateQuiz, difficulty, questionCount, isGeneratingQuiz, generationRunPaused, refreshQuiz, patchNodeStudyState, settlePausedProgress, setResolvedQuizIdForNode, handleMutationError]);

  const handleRegenerate = useCallback(async (feedback: string, questionCountOverride?: number) => {
    if (!node || !quiz || isGeneratingQuiz || generationRunPaused || !canGenerateQuiz) return;
    const finalQuestionCount = questionCountOverride ?? questionCount;
    if (questionCountOverride !== undefined) {
      setQuestionCount(questionCountOverride);
    }
    const activeQuestionCount = quiz.questions.filter((question) => question.is_active).length;
    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingQuizNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      isGeneratingQuiz: true,
      ...patchForGenerationJobStart(),
    });
    if (isViewingNode(nodeId)) {
      setShowRegenerateModal(false);
    }
    try {
      const { result, progress, runId } = await generationJobService.runJob(
        () => quizService.startGenerate(nodeId, {
          difficulty,
          question_count: finalQuestionCount,
          mode: "regenerate",
          quiz_id: quizId,
          mentor_feedback: feedback || undefined,
          resize_question_count: finalQuestionCount !== activeQuestionCount,
        }),
        (progress) => {
          latestRunId = progress.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progress));
        },
      );
      if (settlePausedProgress(progress, "quiz", nodeId)) return;
      if (!result) throw new Error("Quiz regeneration completed without a result.");
      latestRunId = runId;
      const generated = result.quiz as QuizOut | null | undefined;
      if (!generated) throw new Error("Quiz regeneration returned no quiz.");
      setResolvedQuizIdForNode(nodeId, generated.quiz_id);
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      if (isViewingNode(nodeId)) {
        setQuiz(generated);
        await refreshQuiz(nodeId, generated.quiz_id);
      }
      toast.success("Quiz regenerated successfully.");
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, latestRunId, "quiz"));
      handleMutationError(err);
    } finally {
      generatingQuizNodeIds.delete(nodeId);
    }
  }, [node, canGenerateQuiz, quiz, questionCount, difficulty, isGeneratingQuiz, generationRunPaused, refreshQuiz, patchNodeStudyState, settlePausedProgress, setResolvedQuizIdForNode, handleMutationError]);

  const handleDeleteDraft = useCallback(async () => {
    if (!node || !quiz || isDeletingDraft) return;
    const nodeId = node.node_id;
    setIsDeletingDraft(true);
    try {
      await quizService.deleteQuiz(nodeId, quiz.quiz_id);
      setQuiz(null);
      setQuizDraftExists(false);
      setCanAccessHints(false);
      setResolvedQuizIdForNode(nodeId, null);
      await refreshQuiz(nodeId, null);
      setShowDeleteDraftModal(false);
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
    try {
      const updated = await quizService.deleteHintsDraft(nodeId, quiz.quiz_id);
      setQuiz(updated);
      await refreshQuiz(nodeId, updated.quiz_id);
      setShowDeleteHintsModal(false);
      toast.success("Hints draft deleted.");
    } catch (err) {
      handleMutationError(err);
    } finally {
      setIsDeletingHintsDraft(false);
    }
  }, [node, quiz, isDeletingHintsDraft, refreshQuiz, handleMutationError]);

  const handleAcceptFailedQc = useCallback(async () => {
    if (!node || !quiz?.quiz_id) return;
    const nodeId = node.node_id;
    try {
      const updated = await quizService.dismissQcWarning(nodeId, quiz.quiz_id);
      setQuiz(updated);
      setResolvedQuizIdForNode(nodeId, updated.quiz_id);
    } catch (err) {
      handleMutationError(err);
    }
  }, [node, quiz?.quiz_id, setResolvedQuizIdForNode, handleMutationError]);

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
    if (!node || !quiz || !canEditQuestions || quiz.is_published) return false;
    try {
      const updated = await quizService.updateQuestion(node.node_id, quiz.quiz_id, questionId, data);
      setQuiz((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => q.question_id === questionId ? updated : q),
        };
      });
      await refreshQuiz(node.node_id, quiz.quiz_id);
      toast.success("Question updated.");
      return true;
    } catch (err) {
      handleMutationError(err);
      return false;
    }
  }, [node, quiz, canEditQuestions, refreshQuiz, handleMutationError]);

  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    if (!node || !quiz || isDeletingQuestion || !canEditQuestions || quiz.is_published) return false;
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
      await refreshQuiz(node.node_id, quiz.quiz_id);
      toast.success("Question removed.");
      return true;
    } catch (err) {
      handleMutationError(err);
      return false;
    } finally {
      setIsDeletingQuestion(null);
    }
  }, [node, quiz, isDeletingQuestion, canEditQuestions, refreshQuiz, handleMutationError]);

  const handleRegenerateQuestion = useCallback(async (questionId: string, feedback: string) => {
    if (!node || !quiz || isRegeneratingQuestion || generationRunPaused || !canEditQuestions || quiz.is_published) return false;
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 10) return false;

    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    setIsRegeneratingQuestion(questionId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, patchForGenerationJobStart());
    try {
      const { result, progress, runId } = await generationJobService.runJob(
        () => quizService.startRegenerateQuestions(nodeId, quizId, {
          question_ids: [questionId],
          mentor_feedback: trimmedFeedback,
        }),
        (progress) => {
          latestRunId = progress.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progress));
        },
      );
      if (settlePausedProgress(progress, "quiz", nodeId)) return false;
      if (!result) throw new Error("Question regeneration completed without a result.");
      latestRunId = runId;
      const updated = result.quiz as QuizOut | null | undefined;
      if (!updated) throw new Error("Question regeneration returned no quiz.");
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        setHintsStaleQuestionIds((previous) => retainQuestionsWithIncompleteHints(previous, updated));
        await refreshQuiz(nodeId, quizId);
      }
      const staleIds = updated.hints_stale_question_ids ?? [];
      if (staleIds.length > 0) {
        setHintsStaleQuestionIds((prev) => [...new Set([...prev, ...staleIds])]);
        toast.success("Question regenerated. Regenerate hints on the Hints page — they were cleared for the updated question.");
      } else {
        toast.success("Question regenerated.");
      }
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      return true;
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, latestRunId, "quiz"));
      handleMutationError(err);
      return false;
    } finally {
      setIsRegeneratingQuestion(null);
    }
  }, [node, quiz, isRegeneratingQuestion, generationRunPaused, canEditQuestions, refreshQuiz, handleMutationError, patchNodeStudyState, settlePausedProgress]);

  const handleCreateQuestion = useCallback(async (data: QuizQuestionCreateRequest) => {
    if (!node || !quiz || !canEditQuestions || quiz.is_published) return false;
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
      return true;
    } catch (err) {
      handleMutationError(err);
      return false;
    }
  }, [node, quiz, canEditQuestions, refreshQuiz, handleMutationError]);

  const handleReorderQuestions = useCallback(async (questionIds: string[]) => {
    if (!node || !quiz || !canEditQuestions || quiz.is_published) return;
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
      await refreshQuiz(node.node_id, quiz.quiz_id);
    } catch (err) {
      handleMutationError(err);
    }
  }, [node, quiz, canEditQuestions, refreshQuiz, handleMutationError]);

  const handleGenerateHints = useCallback(async () => {
    if (!node || !quiz || isGeneratingHints || generationRunPaused || !canGenerateHints) return;
    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingHintsNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      isGeneratingHints: true,
      ...patchForGenerationJobStart(),
    });
    try {
      const { result, progress, runId } = await generationJobService.runJob(
        () => quizService.startGenerateHints(nodeId, quizId),
        (progress) => {
          latestRunId = progress.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progress));
        },
      );
      if (settlePausedProgress(progress, "hint", nodeId)) return;
      if (!result) throw new Error("Hint generation completed without a result.");
      latestRunId = runId;
      const updated = result.quiz as QuizOut | null | undefined;
      if (!updated) throw new Error("Hint generation returned no quiz.");
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        setHintsStaleQuestionIds((previous) => retainQuestionsWithIncompleteHints(previous, updated));
        await refreshQuiz(nodeId, quizId);
      }
      toast.success("Hints generated for all questions.");
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, latestRunId, "hint"));
      handleMutationError(err);
    } finally {
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [node, quiz, isGeneratingHints, generationRunPaused, canGenerateHints, refreshQuiz, patchNodeStudyState, settlePausedProgress, handleMutationError]);

  const handleRegenerateAllHints = useCallback(async (feedback: string) => {
    if (!node || !quiz || isGeneratingHints || generationRunPaused || !canRegenerateHints) return false;
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 10) return false;

    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingHintsNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      isGeneratingHints: true,
      ...patchForGenerationJobStart(),
    });
    try {
      const { result, progress, runId } = await generationJobService.runJob(
        () => quizService.startRegenerateHints(nodeId, quizId, {
          scope: "all",
          mentor_feedback: trimmedFeedback,
        }),
        (progress) => {
          latestRunId = progress.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progress));
        },
      );
      if (settlePausedProgress(progress, "hint", nodeId)) return false;
      if (!result) throw new Error("Hint regeneration completed without a result.");
      latestRunId = runId;
      const updated = result.quiz as QuizOut | null | undefined;
      if (!updated) throw new Error("Hint regeneration returned no quiz.");
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        setHintsStaleQuestionIds((previous) => retainQuestionsWithIncompleteHints(previous, updated));
        await refreshQuiz(nodeId, quizId);
      }
      toast.success("Hints regenerated for all questions.");
      return true;
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, latestRunId, "hint"));
      handleMutationError(err);
      return false;
    } finally {
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [node, quiz, isGeneratingHints, generationRunPaused, canRegenerateHints, refreshQuiz, patchNodeStudyState, settlePausedProgress, handleMutationError]);

  const handleRegenerateHints = useCallback(async (questionId: string, feedback?: string) => {
    if (!node || !quiz || isGeneratingHints || generationRunPaused || hintsLocked) return false;
    const nodeId = node.node_id;
    const quizId = quiz.quiz_id;
    generatingHintsNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      isGeneratingHints: true,
      ...patchForGenerationJobStart(),
    });
    try {
      const { result, progress, runId } = await generationJobService.runJob(
        () => quizService.startRegenerateHints(nodeId, quizId, {
          scope: "selective",
          question_ids: [questionId],
          mentor_feedback: feedback?.trim() || undefined,
        }),
        (progress) => {
          latestRunId = progress.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progress));
        },
      );
      if (settlePausedProgress(progress, "hint", nodeId)) return false;
      if (!result) throw new Error("Hint regeneration completed without a result.");
      latestRunId = runId;
      const updated = result.quiz as QuizOut | null | undefined;
      if (!updated) throw new Error("Hint regeneration returned no quiz.");
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        setHintsStaleQuestionIds((previous) =>
          previous.filter((id) => id !== questionId),
        );
        await refreshQuiz(nodeId, quizId);
      }
      toast.success("Hints regenerated.");
      return true;
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, latestRunId, "hint"));
      handleMutationError(err);
      return false;
    } finally {
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [node, quiz, isGeneratingHints, generationRunPaused, hintsLocked, refreshQuiz, patchNodeStudyState, settlePausedProgress, handleMutationError]);

  const resolveActivePipeline = useCallback((): "quiz" | "hint" | null => {
    if (failedGenerationPipeline === "quiz" || isGeneratingQuiz || isRegeneratingQuestion) {
      return "quiz";
    }
    if (failedGenerationPipeline === "hint" || isGeneratingHints) return "hint";
    return null;
  }, [
    failedGenerationPipeline,
    isGeneratingHints,
    isGeneratingQuiz,
    isRegeneratingQuestion,
  ]);

  const handlePauseGeneration = useCallback(async () => {
    if (!node || isPausingGeneration || isAbandoningGeneration) return;
    const runId = activeGenerationRunId ?? generationProgressSessionId;
    const pipeline = resolveActivePipeline();
    if (!runId || !pipeline) return;

    const nodeId = node.node_id;
    patchNodeStudyState(nodeId, { isPausingGeneration: true });
    try {
      await generationJobService.pauseRun(runId);
      const progress = await generationJobService.waitForPaused(runId, (update) => {
        patchNodeStudyState(nodeId, patchGenerationProgressUpdate(update));
      });
      if (settlePausedProgress(progress, pipeline, nodeId)) return;
      if (progress.status === "completed") {
        await applyCompletedRunResult(nodeId, pipeline, runId);
        return;
      }
      patchNodeStudyState(
        nodeId,
        patchForGenerationJobFailure(
          new GenerationJobFailedError(
            progress.error ?? "Generation failed.",
            runId,
          ),
          runId,
          pipeline,
        ),
      );
    } catch (err) {
      handleMutationError(err);
      patchNodeStudyState(nodeId, { isPausingGeneration: false });
    } finally {
      generatingQuizNodeIds.delete(nodeId);
      generatingHintsNodeIds.delete(nodeId);
    }
  }, [
    activeGenerationRunId,
    applyCompletedRunResult,
    generationProgressSessionId,
    handleMutationError,
    isAbandoningGeneration,
    isPausingGeneration,
    node,
    patchNodeStudyState,
    resolveActivePipeline,
    settlePausedProgress,
  ]);

  const handleAbandonGeneration = useCallback(async () => {
    if (!node || isAbandoningGeneration) return;
    const runId = activeGenerationRunId ?? generationProgressSessionId;
    const pipeline = resolveActivePipeline();
    if (!runId || !pipeline) return;

    const nodeId = node.node_id;
    const resourceId = pipeline === "hint"
      ? currentQuizId
      : (currentQuizId ?? nodeId);
    if (!resourceId) return;

    patchNodeStudyState(nodeId, { isAbandoningGeneration: true });
    try {
      await generationJobService.abandonRun(runId);
      await generationJobService.waitForResourceIdle(resourceId, pipeline);
      patchNodeStudyState(nodeId, patchForGenerationJobAbandoned());
      setIsRegeneratingQuestion(null);
      generatingQuizNodeIds.delete(nodeId);
      generatingHintsNodeIds.delete(nodeId);
      await refreshQuiz(nodeId, currentQuizId);
    } catch (err) {
      handleMutationError(err);
      patchNodeStudyState(nodeId, { isAbandoningGeneration: false });
    }
  }, [
    activeGenerationRunId,
    currentQuizId,
    generationProgressSessionId,
    handleMutationError,
    isAbandoningGeneration,
    node,
    patchNodeStudyState,
    refreshQuiz,
    resolveActivePipeline,
  ]);

  const handleResumeFailedGeneration = useCallback(async () => {
    if (!node || isResumingFailedGeneration || !failedGenerationPipeline) return;
    if (!generationRunFailed && !generationRunPaused) return;
    const pipeline = failedGenerationPipeline;
    if (pipeline !== "quiz" && pipeline !== "hint") return;
    const runId = activeGenerationRunId ?? generationProgressSessionId;
    if (!runId) return;

    const nodeId = node.node_id;
    const quizId = quiz?.quiz_id ?? currentQuizId;
    setIsResumingFailedGeneration(true);
    if (pipeline === "quiz") generatingQuizNodeIds.add(nodeId);
    if (pipeline === "hint") generatingHintsNodeIds.add(nodeId);

    // Clear paused seed so Continue cannot keep a stale checklist painted.
    patchNodeStudyState(nodeId, {
      generationRunFailed: false,
      generationRunPaused: false,
      isGeneratingQuiz: pipeline === "quiz",
      isGeneratingHints: pipeline === "hint",
      generationProgressSessionId: runId,
      activeGenerationRunId: runId,
      generationProgress: null,
    });

    try {
      const { result, progress } = await generationJobService.resumeJob(
        runId,
        (progressUpdate) => {
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progressUpdate));
        },
        {
          onResumeLive: () => {
            // Hand off to the normal generation progress UI (same as a fresh start).
            setIsResumingFailedGeneration(false);
          },
        },
      );
      if (settlePausedProgress(progress, pipeline, nodeId)) return;
      if (!result) throw new Error("Resume completed without a quiz result.");
      const updated = result.quiz as QuizOut | null | undefined;
      if (!updated) throw new Error("Resume returned no quiz.");
      if (pipeline === "quiz") {
        setResolvedQuizIdForNode(nodeId, updated.quiz_id);
      }
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      if (isViewingNode(nodeId)) {
        setQuiz(updated);
        await refreshQuiz(nodeId, updated.quiz_id ?? quizId);
      }
      toast.success(pipeline === "hint" ? "Hint generation resumed." : "Quiz generation resumed.");
    } catch (err) {
      patchNodeStudyState(nodeId, patchForGenerationJobFailure(err, runId, pipeline));
      toast.error(extractResumeErrorDetail(err));
    } finally {
      if (pipeline === "quiz") generatingQuizNodeIds.delete(nodeId);
      if (pipeline === "hint") generatingHintsNodeIds.delete(nodeId);
      setIsResumingFailedGeneration(false);
      setIsRegeneratingQuestion(null);
    }
  }, [
    node,
    quiz,
    currentQuizId,
    isResumingFailedGeneration,
    generationRunFailed,
    generationRunPaused,
    failedGenerationPipeline,
    activeGenerationRunId,
    generationProgressSessionId,
    patchNodeStudyState,
    refreshQuiz,
    settlePausedProgress,
    setResolvedQuizIdForNode,
  ]);

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
    generationProgressSessionId,
    activeGenerationRunId,
    generationProgress,
    generationRunFailed,
    generationRunPaused,
    failedGenerationPipeline,
    isResumingFailedGeneration,
    isPausingGeneration,
    isAbandoningGeneration,
    isPublishing,
    isUnpublishing,
    isDeletingDraft,
    isDeletingHintsDraft,
    isDeletingQuestion,
    isRegeneratingQuestion,
    hintsStaleQuestionIds,
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
    handlePauseGeneration,
    handleAbandonGeneration,
    handleResumeFailedGeneration,
    handleRegenerate,
    handleDeleteDraft,
    handleDeleteHintsDraft,
    handlePublishQuiz,
    confirmPublishQuiz,
    handleUnpublishQuiz,
    confirmUnpublishQuiz,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleRegenerateQuestion,
    handleCreateQuestion,
    handleReorderQuestions,
    handleGenerateHints,
    handleRegenerateAllHints,
    handleRegenerateHints,
    handleProceedToHints,
    handleViewHistoryQuiz,
    handleCloseHistoryView,
    handleDeleteHistoryQuiz,
    handleAcceptFailedQc,
    isViewingHistoryQuiz: viewingHistoryQuizId !== null,
    isLoadingHistoryQuiz,
    historyQuiz,
    viewingHistoryItem,
  };
}
