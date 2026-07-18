import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { TopicContentPage } from "../../spaces/types/node.types";
import type {
  ReferenceMaterialOut,
  NodeMediaOut,
  RetentionMode,
  StudyMaterialClearDraftsEligibilityOut,
  StudyMaterialFeedbackMode,
  StudyMaterialFeedbackResponse,
  StudyMaterialMentorUiStateOut,
  StudyMaterialPublishPreviewOut,
  StudyMaterialUnpublishPreviewOut,
  StudyMaterialVersionOut,
  StudyMaterialVersionSummary,
  NodeStudyStatePatch,
  NodeStudyState,
} from "../types/studyMaterial.types";
import { studyMaterialService } from "../services/studyMaterialService";
import { referenceMaterialService } from "../services/referenceMaterialService";
import { generationJobService } from "../../generation/services/generationProgressService";
import type { GenerationPipeline } from "../../generation/types/generationProgress.types";
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
import {
  computeShouldShowHistoryHub,
  partitionHistoryVersions,
  shouldSilentlyActivateOnSelect,
  type HistoryVersionPartitions,
} from "../utils/versionHistoryPartitions";
import {
  loadInstructionBannerDismissals,
  saveInstructionBannerDismissals,
} from "../utils/instructionBannerDismissal";

// Re-export for consumers that import from this hook
export type { NodeStudyStatePatch, NodeStudyState };

type VersionHistoryLists = {
  history: StudyMaterialVersionSummary[];
  archived: StudyMaterialVersionSummary[];
};

export type RefModalMode = "manage" | "view";

/** Shown when a draft's frozen reference_material_id no longer has an active upload. */
export const SOURCE_PDF_DELETED_BLOCK_REASON =
  "The reference PDF for this draft was removed. Upload a new PDF, or discard drafts and generate fresh from page 1 without a reference document.";

/** Design §14 — mild mentor copy when External Research fail-softs (not QC tone). */
export const EXTERNAL_RESEARCH_FAIL_SOFT_MESSAGE =
  "We couldn't find enough reliable information online for this topic, so this version was generated without external references. You can attach a reference PDF instead, or edit the generated content directly.";

function isSourcePdfDeleted(
  activeVersion: StudyMaterialVersionOut | null,
  referenceMaterial: ReferenceMaterialOut | null,
  isLoadingGenerationSource: boolean,
): boolean {
  return Boolean(
    activeVersion?.reference_material_id != null &&
    !referenceMaterial &&
    !isLoadingGenerationSource
  );
}

/** Nodes with an in-flight generate/regenerate/improve request (survives node switches). */
const generatingNodeIds = new Set<string>();
const recoveringRunIds = new Set<string>();

interface UseStudyMaterialParams {
  node: NodeTreeNode | null;
  spaceId: string;
  spaceIsPublished?: boolean;
  isMentor: boolean;
  studyState?: NodeStudyState;
  onStudyStateChange?: (nodeId: string, patch: NodeStudyStatePatch) => void;
  onMentorProgressRefresh?: () => void;
  contentRefreshToken?: number;
  /** Optional space-scoped external research preference (Generate All sync). */
  externalResearchEnabled?: boolean;
  onExternalResearchChange?: (enabled: boolean) => void;
}

export interface UseStudyMaterialReturn {
  // ── Convenient accessors (derived from props) ──────────────────────────
  currentPage: TopicContentPage;
  hasTriggeredGeneration: boolean;
  studyMaterialContent: string | null;
  activeVersion: StudyMaterialVersionOut | null;
  isGenerating: boolean;
  generationProgressSessionId: string | null;
  activeGenerationRunId: string | null;
  generationRunFailed: boolean;
  generationRunPaused: boolean;
  failedGenerationPipeline: GenerationPipeline | null;
  isResumingFailedGeneration: boolean;
  isPausingGeneration: boolean;
  isAbandoningGeneration: boolean;
  referenceMaterial: ReferenceMaterialOut | null;
  nodeMedia: NodeMediaOut[];
  isLoadingGenerationSource: boolean;
  isLoadingTopicResources: boolean;
  externalResearchEnabled: boolean;
  setExternalResearchEnabled: (enabled: boolean) => void;
  showExternalResearchFailSoftBanner: boolean;
  dismissExternalResearchFailSoftBanner: () => void;
  externalResearchFailSoftMessage: string;
  setCurrentPage: (p: TopicContentPage) => void;

  // ── State ─────────────────────────────────────────────────────────────
  feedbackModalMode: StudyMaterialFeedbackMode | null;
  setFeedbackModalMode: (mode: StudyMaterialFeedbackMode | null) => void;
  isManualEditMode: boolean;
  setIsManualEditMode: (v: boolean) => void;
  versionHistory: StudyMaterialVersionSummary[];
  archivedVersionHistory: StudyMaterialVersionSummary[];
  showArchivedPanel: boolean;
  setShowArchivedPanel: React.Dispatch<React.SetStateAction<boolean>>;
  studentArchiveExpanded: boolean;
  focusStudentArchiveNonce: number;
  expandStudentArchive: () => void;
  setStudentArchiveExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingVersions: boolean;
  viewingVersionId: string | null;
  isActivatingVersion: boolean;
  isPublishingVersion: boolean;
  isUnpublishingVersion: boolean;
  isArchivingVersion: boolean;
  isUnarchivingVersion: boolean;
  isDownloadingPdf: boolean;
  isSavingManualEdit: boolean;
  processingLabel: string | null;
  showDeleteDraftModal: boolean;
  setShowDeleteDraftModal: (v: boolean) => void;
  showRegenerateConfirmModal: boolean;
  setShowRegenerateConfirmModal: (v: boolean) => void;
  showRefModal: boolean;
  setShowRefModal: (v: boolean) => void;
  refModalMode: RefModalMode;
  setRefModalMode: (mode: RefModalMode) => void;
  refModalFocusDropzone: boolean;
  setRefModalFocusDropzone: (v: boolean) => void;
  openRefModalManage: (options?: { focusDropzone?: boolean }) => void;
  openRefModalView: () => void;
  handleRequestReplaceSource: () => void;
  sourceDocMismatch: boolean;
  showSourceDocMismatchBanner: boolean;
  dismissSourceDocMismatchBanner: () => void;
  sourcePdfDeleted: boolean;
  sourcePdfDeletedBlockReason: string;
  canRegenerateOrImproveDraft: boolean;
  openFeedbackModal: (mode: StudyMaterialFeedbackMode) => void;
  showNodeMediaModal: boolean;
  setShowNodeMediaModal: (v: boolean) => void;
  isDeletingDrafts: boolean;
  clearDraftsEligibility: StudyMaterialClearDraftsEligibilityOut | null;

  // ── Computed ──────────────────────────────────────────────────────────
  canAccessStudyMaterial: boolean;
  hasWorkspaceStudyMaterial: boolean;
  canAccessQuiz: boolean;
  displayedVersionId: string | null;
  displayedVersionSummary: StudyMaterialVersionSummary | null;
  displayedVersionBaseLabel: string | null;
  isDisplayedActiveWorkingDraft: boolean;
  isViewingArchivedVersion: boolean;
  isViewingNonActiveVersion: boolean;
  shouldShowHistoryHub: boolean;
  isHistoryHubView: boolean;
  isHistoryDetailView: boolean;
  historyPartitions: HistoryVersionPartitions;
  canEditActiveDraft: boolean;
  canArchiveDisplayedVersion: boolean;
  canPublishDisplayedVersion: boolean;
  canUnpublishDisplayedVersion: boolean;
  publishButtonLabel: string;
  publishDisabledTooltip: string | null;
  unpublishButtonLabel: string;
  unpublishTooltip: string | null;
  unpublishDisabledTooltip: string | null;
  publishedVersionId: string | null;
  canClearAllDrafts: boolean;
  clearDraftsBlockReason: string | undefined;
  showInstructionChangeBanner: boolean;
  mentorUiState: StudyMaterialMentorUiStateOut | null;
  publishPreview: StudyMaterialPublishPreviewOut | null;
  unpublishPreview: StudyMaterialUnpublishPreviewOut | null;
  showEspaceNotPublishedModal: boolean;
  publishTransactionError: string | null;
  unpublishTransactionError: string | null;
  setShowEspaceNotPublishedModal: (v: boolean) => void;
  closePublishModal: () => void;
  closeUnpublishModal: () => void;
  confirmPublish: (supersededRetentionMode?: RetentionMode) => Promise<void>;
  confirmUnpublish: (retentionMode: RetentionMode) => Promise<void>;

  // ── Handlers ─────────────────────────────────────────────────────────
  handleGenerateStudyMaterial: () => Promise<void>;
  handlePauseGeneration: () => Promise<void>;
  handleAbandonGeneration: () => Promise<void>;
  handleResumeFailedGeneration: () => Promise<void>;
  handleRegenerateStudyMaterialFresh: () => Promise<void>;
  runFeedbackAction: (mode: StudyMaterialFeedbackMode, feedback: string) => Promise<void>;
  handleManualEditSave: (content: string) => Promise<void>;
  handleSelectVersion: (versionId: string) => Promise<void>;
  handleActivateVersion: (versionId: string) => Promise<void>;
  handleReturnToActiveDraft: () => Promise<void>;
  handleBackToHistory: () => void;
  handleArchiveCurrentVersion: () => void;
  handleUnarchiveCurrentVersion: () => void;
  handleUnarchiveVersion: (versionId: string) => Promise<void>;
  handleDownloadDisplayedVersionPdf: () => Promise<void>;
  handleClearAllDrafts: () => Promise<void>;
  handlePublishCurrentVersion: () => void;
  handleUnpublishCurrentVersion: () => void;
  handleKeepExistingDraftsAfterMove: () => void;
  handleUseNewInstructions: () => void;
  setReferenceMaterial: (m: ReferenceMaterialOut | null) => void;
  setReferenceMaterialForNode: (nodeId: string, m: ReferenceMaterialOut | null) => void;
  refreshGenerationSource: () => Promise<void>;
  refreshTopicResources: () => Promise<NodeMediaOut[]>;
  handleAcceptFailedQc: () => Promise<void>;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useStudyMaterial({
  node,
  spaceId: _spaceId,
  spaceIsPublished,
  isMentor,
  studyState,
  onStudyStateChange,
  onMentorProgressRefresh,
  contentRefreshToken = 0,
  externalResearchEnabled: externalResearchEnabledProp,
  onExternalResearchChange,
}: UseStudyMaterialParams): UseStudyMaterialReturn {
  // ── Local state ───────────────────────────────────────────────────────────
  const [feedbackModalMode, setFeedbackModalMode] = useState<StudyMaterialFeedbackMode | null>(null);
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [versionHistory, setVersionHistory] = useState<StudyMaterialVersionSummary[]>([]);
  const [archivedVersionHistory, setArchivedVersionHistory] = useState<StudyMaterialVersionSummary[]>([]);
  const [showArchivedPanel, setShowArchivedPanel] = useState(false);
  const [studentArchiveExpanded, setStudentArchiveExpanded] = useState(false);
  const [focusStudentArchiveNonce, setFocusStudentArchiveNonce] = useState(0);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const [isActivatingVersion, setIsActivatingVersion] = useState(false);
  const [isPublishingVersion, setIsPublishingVersion] = useState(false);
  const [isUnpublishingVersion, setIsUnpublishingVersion] = useState(false);
  const [isArchivingVersion, setIsArchivingVersion] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isUnarchivingVersion, setIsUnarchivingVersion] = useState(false);
  const [isSavingManualEdit, setIsSavingManualEdit] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState(false);
  /** Per-node: effective instruction the user dismissed the change banner for. */
  const [instructionBannerDismissedByNode, setInstructionBannerDismissedByNode] = useState<
    Record<string, string>
  >(() => loadInstructionBannerDismissals());
  const prevEffectiveInstructionByNodeRef = useRef<Record<string, string>>({});
  const [clearDraftsEligibility, setClearDraftsEligibility] =
    useState<StudyMaterialClearDraftsEligibilityOut | null>(null);
  const [mentorUiState, setMentorUiState] =
    useState<StudyMaterialMentorUiStateOut | null>(null);
  const [isLoadingMentorUiState, setIsLoadingMentorUiState] = useState(false);
  const [publishPreview, setPublishPreview] =
    useState<StudyMaterialPublishPreviewOut | null>(null);
  const [unpublishPreview, setUnpublishPreview] =
    useState<StudyMaterialUnpublishPreviewOut | null>(null);
  const [showEspaceNotPublishedModal, setShowEspaceNotPublishedModal] = useState(false);
  const [publishTransactionError, setPublishTransactionError] = useState<string | null>(null);
  const [unpublishTransactionError, setUnpublishTransactionError] = useState<string | null>(null);
  const [pendingPublishVersionId, setPendingPublishVersionId] = useState<string | null>(null);
  const [pendingUnpublishVersionId, setPendingUnpublishVersionId] = useState<string | null>(null);
  const [isDeletingDrafts, setIsDeletingDrafts] = useState(false);
  const [showRefModal, setShowRefModal] = useState(false);
  const [refModalMode, setRefModalMode] = useState<RefModalMode>("manage");
  const [refModalFocusDropzone, setRefModalFocusDropzone] = useState(false);
  const [sourceDocMismatchDismissedByNode, setSourceDocMismatchDismissedByNode] = useState<
    Record<string, string>
  >({});
  const [showNodeMediaModal, setShowNodeMediaModal] = useState(false);
  const [nodeMedia, setNodeMedia] = useState<NodeMediaOut[]>([]);
  const [isLoadingGenerationSource, setIsLoadingGenerationSource] = useState(false);
  const [isLoadingTopicResources, setIsLoadingTopicResources] = useState(false);
  /** Mentor toggle: External Research Mode (mutually exclusive with a source PDF). */
  const [externalResearchByNode, setExternalResearchByNode] = useState<Record<string, boolean>>({});
  const [externalResearchFailSoftDismissedByNode, setExternalResearchFailSoftDismissedByNode] =
    useState<Record<string, string>>({});
  const usesControlledExternalResearch = typeof onExternalResearchChange === "function";

  const onStudyStateChangeRef = useRef(onStudyStateChange);
  onStudyStateChangeRef.current = onStudyStateChange;
  const onMentorProgressRefreshRef = useRef(onMentorProgressRefresh);
  onMentorProgressRefreshRef.current = onMentorProgressRefresh;
  const currentNodeIdRef = useRef(node?.node_id);
  currentNodeIdRef.current = node?.node_id;

  const patchNodeStudyState = useCallback((nodeId: string, patch: NodeStudyStatePatch) => {
    onStudyStateChangeRef.current?.(nodeId, patch);
  }, []);

  const isViewingNode = (nodeId: string) => currentNodeIdRef.current === nodeId;
  const [isResumingFailedGeneration, setIsResumingFailedGeneration] = useState(false);
  const refreshVersionHistoryRef = useRef<(nodeId: string) => Promise<VersionHistoryLists | null>>(
    async () => null,
  );
  const refreshMentorUiStateRef = useRef<(nodeId: string, viewingId?: string | null) => Promise<void>>(
    async () => {}
  );
  const versionHistoryRequestRef = useRef(0);
  const generationSourceRequestRef = useRef(0);

  // ── Convenient accessors into lifted state ────────────────────────────────
  const currentPage = studyState?.currentPage ?? 1;
  const hasTriggeredGeneration = studyState?.hasTriggeredGeneration ?? false;
  const studyMaterialContent = studyState?.studyMaterialContent ?? null;
  const activeVersion = studyState?.activeVersion ?? null;
  const isGenerating = studyState?.isGenerating ?? false;
  const generationProgressSessionId = studyState?.generationProgressSessionId ?? null;
  const activeGenerationRunId = studyState?.activeGenerationRunId ?? null;
  const generationRunFailed = studyState?.generationRunFailed ?? false;
  const generationRunPaused = studyState?.generationRunPaused ?? false;
  const failedGenerationPipeline = studyState?.failedGenerationPipeline ?? null;
  const isPausingGeneration = studyState?.isPausingGeneration ?? false;
  const isAbandoningGeneration = studyState?.isAbandoningGeneration ?? false;
  const referenceMaterial = studyState?.referenceMaterial ?? null;
  const currentEffectiveInstruction = node?.effective_instruction ?? "";
  const externalResearchPreference = usesControlledExternalResearch
    ? Boolean(externalResearchEnabledProp)
    : Boolean(node?.node_id && externalResearchByNode[node.node_id]);
  const externalResearchEnabled = Boolean(
    externalResearchPreference && !referenceMaterial,
  );

  const setExternalResearchEnabled = useCallback(
    (enabled: boolean) => {
      if (!node) return;
      if (enabled && referenceMaterial) return;
      if (usesControlledExternalResearch) {
        onExternalResearchChange?.(enabled);
        return;
      }
      setExternalResearchByNode((prev) => ({
        ...prev,
        [node.node_id]: enabled,
      }));
    },
    [node, referenceMaterial, usesControlledExternalResearch, onExternalResearchChange],
  );

  useEffect(() => {
    saveInstructionBannerDismissals(instructionBannerDismissedByNode);
  }, [instructionBannerDismissedByNode]);

  const setCurrentPage = (p: TopicContentPage) => {
    if (!node) return;
    patchNodeStudyState(node.node_id, { currentPage: p });
  };
  const setReferenceMaterialForNode = useCallback(
    (nodeId: string, m: ReferenceMaterialOut | null) => {
      patchNodeStudyState(nodeId, { referenceMaterial: m });
      // PDF and External Research are mutually exclusive — attaching a PDF clears the toggle.
      if (m) {
        if (usesControlledExternalResearch && nodeId === node?.node_id) {
          onExternalResearchChange?.(false);
        } else {
          setExternalResearchByNode((prev) =>
            prev[nodeId] ? { ...prev, [nodeId]: false } : prev,
          );
        }
      }
    },
    [patchNodeStudyState, usesControlledExternalResearch, onExternalResearchChange, node?.node_id]
  );
  const setReferenceMaterial = (m: ReferenceMaterialOut | null) => {
    if (!node) return;
    setReferenceMaterialForNode(node.node_id, m);
  };

  const refreshGenerationSource = useCallback(async () => {
    if (!node || !isMentor) return;
    const requestId = ++generationSourceRequestRef.current;
    setIsLoadingGenerationSource(true);
    try {
      const latest = await referenceMaterialService.getLatestByNode(node.node_id);
      if (requestId !== generationSourceRequestRef.current) return;
      patchNodeStudyState(node.node_id, { referenceMaterial: latest });
      if (latest) {
        if (usesControlledExternalResearch) {
          onExternalResearchChange?.(false);
        } else {
          setExternalResearchByNode((prev) =>
            prev[node.node_id] ? { ...prev, [node.node_id]: false } : prev,
          );
        }
      }    } catch {
      /* non-critical */
    } finally {
      if (requestId === generationSourceRequestRef.current) {
        setIsLoadingGenerationSource(false);
      }
    }
  }, [
    node,
    isMentor,
    patchNodeStudyState,
    usesControlledExternalResearch,
    onExternalResearchChange,
  ]);

  const refreshTopicResources = useCallback(async (): Promise<NodeMediaOut[]> => {
    if (!node || !isMentor) return [];
    setIsLoadingTopicResources(true);
    try {
      const mediaRes = await referenceMaterialService.listNodeMedia(node.node_id);
      setNodeMedia(mediaRes.items);
      return mediaRes.items;
    } catch {
      /* non-critical */
      return [];
    } finally {
      setIsLoadingTopicResources(false);
    }
  }, [node, isMentor]);

  /** After external generate/regenerate: refresh resources and toast when article links exist. */
  const refreshExternalSourcesAfterGenerate = useCallback(
    async (usedExternalResearch: boolean) => {
      if (!usedExternalResearch) return;
      const items = await refreshTopicResources();
      const hasArticleLinks = items.some((item) => item.media_type === "article_link");
      if (hasArticleLinks) {
        toast.success("External sources have been added for student reference.");
      }
    },
    [refreshTopicResources],
  );

  const applyVersion = (nodeId: string, version: StudyMaterialVersionOut, clearViewing = true) => {
    if (clearViewing) setViewingVersionId(null);
    patchNodeStudyState(nodeId, {
      studyMaterialContent: version.content,
      activeVersion: version,
      hasTriggeredGeneration: true,
    });
  };

  // Clear dismiss only when this node's effective instruction actually changes
  // (e.g. after reparenting), not when switching to another node in the tree.
  useEffect(() => {
    if (!node) return;
    const nodeId = node.node_id;
    const previous = prevEffectiveInstructionByNodeRef.current[nodeId];
    if (previous !== undefined && previous !== currentEffectiveInstruction) {
      setInstructionBannerDismissedByNode((dismissed) => {
        if (!(nodeId in dismissed)) return dismissed;
        const next = { ...dismissed };
        delete next[nodeId];
        return next;
      });
    }
    prevEffectiveInstructionByNodeRef.current[nodeId] = currentEffectiveInstruction;
  }, [node?.node_id, currentEffectiveInstruction]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const refreshMentorUiState = useCallback(
    async (nodeId: string, viewingId?: string | null) => {
      setIsLoadingMentorUiState(true);
      try {
        const state = await studyMaterialService.getMentorUiState(
          nodeId,
          viewingId ?? viewingVersionId
        );
        setMentorUiState(state);
        if (state.has_versions) {
          patchNodeStudyState(nodeId, { hasTriggeredGeneration: true });
        } else {
          patchNodeStudyState(nodeId, {
            hasTriggeredGeneration: false,
            studyMaterialContent: null,
            activeVersion: null,
          });
        }
      } catch {
        setMentorUiState(null);
      } finally {
        setIsLoadingMentorUiState(false);
      }
    },
    [viewingVersionId, patchNodeStudyState]
  );

  refreshMentorUiStateRef.current = refreshMentorUiState;

  const refreshClearDraftsEligibility = useCallback(async (nodeId: string) => {
    try {
      const eligibility = await studyMaterialService.getClearDraftsEligibility(nodeId);
      setClearDraftsEligibility(eligibility);
    } catch {
      setClearDraftsEligibility(null);
    }
  }, []);

  const refreshVersionHistory = useCallback(async (nodeId: string): Promise<VersionHistoryLists | null> => {
    const requestId = ++versionHistoryRequestRef.current;
    setIsLoadingVersions(true);
    try {
      const [history, archived] = await Promise.all([
        studyMaterialService.listVersions(nodeId, { archived: false }),
        studyMaterialService.listVersions(nodeId, { archived: true }),
      ]);
      if (requestId !== versionHistoryRequestRef.current) return null;
      setVersionHistory(history.versions);
      setArchivedVersionHistory(archived.versions);
      await refreshClearDraftsEligibility(nodeId);
      return { history: history.versions, archived: archived.versions };
    } catch {
      /* non-critical */
      return null;
    } finally {
      if (requestId === versionHistoryRequestRef.current) {
        setIsLoadingVersions(false);
      }
    }
  }, [refreshClearDraftsEligibility]);

  refreshVersionHistoryRef.current = refreshVersionHistory;

  const resetStudyMaterialAfterAbandon = useCallback(async (nodeId: string) => {
    await refreshVersionHistoryRef.current(nodeId);
    await refreshMentorUiStateRef.current(nodeId, null);
    const active = await studyMaterialService.getActiveVersion(nodeId);
    if (active) {
      patchNodeStudyState(nodeId, {
        ...patchForGenerationJobAbandoned(),
        currentPage: 2,
        hasTriggeredGeneration: true,
        studyMaterialContent: active.content,
        activeVersion: active,
      });
      return;
    }

    const history = await studyMaterialService.listVersions(nodeId, { archived: false });
    const latestSummary = history.versions[0];
    if (latestSummary) {
      const version = await studyMaterialService.getVersion(nodeId, latestSummary.version_id);
      patchNodeStudyState(nodeId, {
        ...patchForGenerationJobAbandoned(),
        currentPage: 2,
        hasTriggeredGeneration: true,
        studyMaterialContent: version.content,
        activeVersion: version,
      });
      return;
    }

    patchNodeStudyState(nodeId, {
      ...patchForGenerationJobAbandoned(),
      currentPage: 1,
      hasTriggeredGeneration: false,
      studyMaterialContent: null,
      activeVersion: null,
    });
  }, [patchNodeStudyState]);

  const allVersionSummaries = useCallback(
    () => [...versionHistory, ...archivedVersionHistory],
    [versionHistory, archivedVersionHistory]
  );

  const findVersionSummary = useCallback(
    (versionId: string | null | undefined) => {
      if (!versionId) return null;
      return allVersionSummaries().find((v) => v.version_id === versionId) ?? null;
    },
    [allVersionSummaries]
  );

  const historyPartitions = useMemo(
    () => partitionHistoryVersions(versionHistory, archivedVersionHistory),
    [versionHistory, archivedVersionHistory]
  );

  const shouldShowHistoryHub = useMemo(
    () =>
      mentorUiState != null &&
      computeShouldShowHistoryHub(versionHistory, archivedVersionHistory, mentorUiState),
    [versionHistory, archivedVersionHistory, mentorUiState]
  );

  const isHistoryHubView = shouldShowHistoryHub && viewingVersionId === null;
  const isHistoryDetailView = shouldShowHistoryHub && viewingVersionId !== null;

  // ── Effects ───────────────────────────────────────────────────────────────

  // Reset page-2 UI when switching nodes — must be declared FIRST so it runs
  // before the async-load effects below. If the reset ran after the loads it
  // would increment versionHistoryRequestRef, making the just-started fetch
  // appear stale and silently drop the result (leaving the panel empty).
  useEffect(() => {
    versionHistoryRequestRef.current += 1;
    generationSourceRequestRef.current += 1;
    setIsLoadingVersions(false);
    setIsLoadingGenerationSource(false);
    setFeedbackModalMode(null);
    setIsManualEditMode(false);
    setViewingVersionId(null);
    setVersionHistory([]);
    setArchivedVersionHistory([]);
    setShowArchivedPanel(false);
    setStudentArchiveExpanded(false);
    setFocusStudentArchiveNonce(0);
    setClearDraftsEligibility(null);
    setShowDeleteDraftModal(false);
    setShowRegenerateConfirmModal(false);
    // Clear stale mentor UI state so the old node's instruction-change banner
    // never bleeds into the newly selected node before the fresh fetch arrives.
    setMentorUiState(null);
    setIsLoadingMentorUiState(false);
    setNodeMedia([]);
    setProcessingLabel(null);
    setIsResumingFailedGeneration(false);
  }, [node?.node_id]);

  // Load generation source and topic resources when switching nodes
  useEffect(() => {
    if (!node || !isMentor) return;
    void refreshGenerationSource();
    void refreshTopicResources();
  }, [node?.node_id, isMentor, refreshGenerationSource, refreshTopicResources]);

  // Enable study-material navigation when mentor-accessible versions exist
  useEffect(() => {
    if (!node || !isMentor || hasTriggeredGeneration) return;
    const nodeId = node.node_id;
    let cancelled = false;
    studyMaterialService
      .getMentorUiState(nodeId)
      .then((state) => {
        if (cancelled || !state.has_versions) return;
        patchNodeStudyState(nodeId, { hasTriggeredGeneration: true });
      })
      .catch(() => {/* non-critical */ });
    return () => {
      cancelled = true;
    };
  }, [node?.node_id, isMentor, hasTriggeredGeneration, patchNodeStudyState]);

  // Re-fetch mentor UI state whenever the node changes, when viewingVersionId
  // changes, OR when the effective instruction changes (e.g. after reparenting
  // the node in the tree, or after saving updated teaching settings).
  // Without currentEffectiveInstruction in deps, a node move would never
  // trigger a re-fetch, so instruction_changed_since_generation would stay
  // stale (false) and the instruction-change banner would never appear.
  useEffect(() => {
    if (!node || !isMentor) return;
    void refreshMentorUiStateRef.current(node.node_id, viewingVersionId);
  }, [node?.node_id, isMentor, viewingVersionId, currentEffectiveInstruction, spaceIsPublished]);

  // Reload active version after space publish/unpublish so is_published flags stay in sync.
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    const nodeId = node.node_id;
    studyMaterialService
      .getActiveVersion(nodeId)
      .then((version) => {
        if (!version) return;
        patchNodeStudyState(nodeId, {
          studyMaterialContent: version.content,
          activeVersion: version,
          hasTriggeredGeneration: true,
        });
      })
      .catch(() => {/* non-critical */ });
    void refreshVersionHistoryRef.current(nodeId);
  }, [node?.node_id, isMentor, currentPage, spaceIsPublished, patchNodeStudyState]);

  // Refresh after content is published from the espace republish checklist modal.
  useEffect(() => {
    if (!node || !isMentor || contentRefreshToken === 0) return;
    const nodeId = node.node_id;
    void refreshMentorUiStateRef.current(nodeId, viewingVersionId);
    void refreshVersionHistoryRef.current(nodeId);
    studyMaterialService
      .getActiveVersion(nodeId)
      .then((version) => {
        if (!version) return;
        patchNodeStudyState(nodeId, {
          studyMaterialContent: version.content,
          activeVersion: version,
          hasTriggeredGeneration: true,
        });
      })
      .catch(() => {/* non-critical */ });
  }, [contentRefreshToken, node?.node_id, isMentor, viewingVersionId, patchNodeStudyState]);

  // Only auto-leave the Material page when every layer is empty. Unpublishing
  // into student archive still leaves versions to view. Discard drafts uses an
  // explicit redirect in handleClearAllDrafts.
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2 || isGenerating) return;
    // Keep the mentor on Material while a study-material run is pausing, paused,
    // or failed — the progress panel (Continue / Delete run) lives here. A paused
    // or failed *first* run has no persisted version yet, so the emptiness check
    // below would otherwise fling the user back to page 1 and hide those controls.
    if (
      isPausingGeneration ||
      ((generationRunPaused || generationRunFailed) &&
        failedGenerationPipeline === "study_material")
    ) {
      return;
    }
    if (mentorUiState === null) return;
    const hasAnyMaterial =
      mentorUiState.has_versions ||
      versionHistory.length > 0 ||
      archivedVersionHistory.length > 0 ||
      (mentorUiState.student_visibility?.previous_version_count ?? 0) > 0 ||
      Boolean(mentorUiState.student_visibility?.live_material_version_id);
    if (hasAnyMaterial) return;
    setCurrentPage(1);
  }, [
    node?.node_id,
    isMentor,
    currentPage,
    isGenerating,
    isPausingGeneration,
    generationRunPaused,
    generationRunFailed,
    failedGenerationPipeline,
    mentorUiState,
    versionHistory.length,
    archivedVersionHistory.length,
  ]);

  // Leave quiz/hints pages when the space is unpublished — mentors may still
  // view quiz drafts per Part 4; only trainees are restricted.
  useEffect(() => {
    if (!isMentor && spaceIsPublished === false && currentPage > 2) {
      setCurrentPage(2);
    }
  }, [spaceIsPublished, currentPage, isMentor]);

  // Load active study material version when opening page 2 without cached content
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    if (studyMaterialContent?.trim() || isGenerating) return;
    const nodeId = node.node_id;
    studyMaterialService
      .getActiveVersion(nodeId)
      .then((version) => {
        if (version) {
          patchNodeStudyState(nodeId, {
            studyMaterialContent: version.content,
            activeVersion: version,
            hasTriggeredGeneration: true,
          });
        }
      })
      .catch(() => {/* non-critical */ });
  }, [node?.node_id, currentPage, studyMaterialContent, isGenerating, isMentor, patchNodeStudyState]);

  // Detect an in-flight or resumable failed async generate for this node (manual click only).
  useEffect(() => {
    if (!node || !isMentor) return;
    if (generatingNodeIds.has(node.node_id)) return;
    if (recoveringRunIds.has(node.node_id)) return;
    if (generationRunFailed && failedGenerationPipeline === "study_material") return;
    if (generationRunPaused && failedGenerationPipeline === "study_material") return;
    // After batch or manual generate the draft may already be in state — ignore stale
    // RUNNING rows left by a race with manual /generate on the same node.
    if (hasTriggeredGeneration && activeVersion) return;
    const nodeId = node.node_id;
    let cancelled = false;
    recoveringRunIds.add(nodeId);
    generationJobService
      .getActiveRun(nodeId, "study_material")
      .then(async (active) => {
        if (cancelled) return;
        if (!active?.run_id) {
          if (isGenerating) {
            patchNodeStudyState(nodeId, {
              isGenerating: false,
              ...patchClearFailedGenerationRun(),
            });
          }
          return;
        }
        const runId = active.run_id;
        if (active.status === "failed") {
          patchNodeStudyState(nodeId, {
            currentPage: 2,
            hasTriggeredGeneration: true,
            ...patchForGenerationJobFailure(
              new GenerationJobFailedError("Generation failed.", runId),
              runId,
              "study_material",
            ),
          });
          return;
        }
        if (active.status === "paused") {
          patchNodeStudyState(nodeId, {
            currentPage: 2,
            hasTriggeredGeneration: true,
            ...patchForGenerationJobPaused(runId, "study_material"),
          });
          return;
        }
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          isGenerating: true,
          generationRunFailed: false,
          generationRunPaused: false,
          failedGenerationPipeline: null,
          generationProgressSessionId: runId,
          activeGenerationRunId: runId,
          hasTriggeredGeneration: true,
        });
        setProcessingLabel("Generating study material");
        try {
          const progress = await generationJobService.waitForCompletion(runId);
          if (progress.status === "paused") {
            patchNodeStudyState(nodeId, {
              currentPage: 2,
              hasTriggeredGeneration: true,
              ...patchForGenerationJobPaused(runId, "study_material"),
            });
            return;
          }
          const result = await generationJobService.getResult(runId);
          if (result.study_material_generate) {
            applyVersion(
              nodeId,
              result.study_material_generate as unknown as StudyMaterialVersionOut,
            );
          } else if (result.study_material_feedback?.new_version) {
            applyVersion(
              nodeId,
              result.study_material_feedback.new_version as unknown as StudyMaterialVersionOut,
            );
          }
          if (isViewingNode(nodeId)) {
            await refreshVersionHistory(nodeId);
            await refreshMentorUiStateRef.current(nodeId, null);
          }
          patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
        } catch (err) {
          const failure = patchForGenerationJobFailure(err, runId, "study_material");
          if (failure.generationRunFailed) {
            patchNodeStudyState(nodeId, {
              currentPage: 2,
              hasTriggeredGeneration: true,
              ...failure,
            });
          }
        } finally {
          if (!cancelled && isViewingNode(nodeId)) {
            setProcessingLabel(null);
          }
        }
      })
      .catch(() => {/* non-critical */})
      .finally(() => {
        recoveringRunIds.delete(nodeId);
      });
    return () => {
      cancelled = true;
      recoveringRunIds.delete(nodeId);
    };
  }, [
    node?.node_id,
    isMentor,
    generationRunFailed,
    failedGenerationPipeline,
    generationRunPaused,
    hasTriggeredGeneration,
    activeVersion,
    patchNodeStudyState,
  ]);

  // Load version history on page 2 (once per node/page — not on every activeVersion change)
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    void refreshVersionHistoryRef.current(node.node_id);
  }, [node?.node_id, currentPage, isMentor]);

  // When entering history-only mode, clear any auto-loaded document so the hub shows.
  const prevShouldShowHistoryHubRef = useRef(false);
  useEffect(() => {
    if (!node) return;
    const enteredHistoryHub = shouldShowHistoryHub && !prevShouldShowHistoryHubRef.current;
    prevShouldShowHistoryHubRef.current = shouldShowHistoryHub;
    if (!enteredHistoryHub) return;
    setViewingVersionId(null);
    setShowArchivedPanel(false);
    patchNodeStudyState(node.node_id, { studyMaterialContent: null });
  }, [shouldShowHistoryHub, node, patchNodeStudyState]);

  // When every draft is in the archive, load one for viewing so Material is not blank.
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2 || isGenerating) return;
    if (!mentorUiState || shouldShowHistoryHub) return;
    if (studyMaterialContent?.trim()) return;
    if (archivedVersionHistory.length === 0) return;
    const workspaceCount = versionHistory.filter((v) => !v.is_archived).length;
    if (workspaceCount > 0) return;

    const archivedId = viewingVersionId ?? archivedVersionHistory[0]?.version_id;
    if (!archivedId) return;

    let cancelled = false;
    setShowArchivedPanel(true);
    studyMaterialService
      .getVersion(node.node_id, archivedId)
      .then((version) => {
        if (cancelled) return;
        setViewingVersionId(archivedId);
        patchNodeStudyState(node.node_id, { studyMaterialContent: version.content });
      })
      .catch(() => {/* non-critical */ });
    return () => {
      cancelled = true;
    };
  }, [
    node?.node_id,
    isMentor,
    currentPage,
    isGenerating,
    studyMaterialContent,
    archivedVersionHistory,
    versionHistory,
    viewingVersionId,
    patchNodeStudyState,
    shouldShowHistoryHub,
    mentorUiState,
  ]);

  // Load the best available version when Material opens with history but no body.
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2 || isGenerating || isLoadingVersions) return;
    if (!mentorUiState || shouldShowHistoryHub) return;
    if (studyMaterialContent?.trim()) return;
    if (versionHistory.length === 0 && archivedVersionHistory.length === 0) return;

    const workspaceVersions = versionHistory.filter(
      (v) =>
        !v.is_archived &&
        v.mentor_display_badge !== "Previous for students" &&
        v.mentor_display_badge !== "Removed from students",
    );
    const studentArchiveVersions = versionHistory.filter(
      (v) => v.mentor_display_badge === "Previous for students"
    );
    const targetSummary =
      workspaceVersions.find((v) => v.is_active) ??
      workspaceVersions[0] ??
      studentArchiveVersions[0] ??
      null;

    if (!targetSummary) return;

    const nodeId = node.node_id;
    let cancelled = false;

    if (targetSummary.mentor_display_badge === "Previous for students") {
      setStudentArchiveExpanded(true);
    }
    setViewingVersionId(targetSummary.version_id);

    const run = async () => {
      try {
        const version = await studyMaterialService.getVersion(nodeId, targetSummary.version_id);
        if (cancelled) return;
        patchNodeStudyState(nodeId, { studyMaterialContent: version.content });
      } catch {
        /* non-critical */
      }

      // If no version is active yet, silently activate this one so that
      // Regenerate / Improve / Manual edit are never blocked on first open.
      if (!cancelled && shouldSilentlyActivateOnSelect(targetSummary)) {
        try {
          const activated = await studyMaterialService.activate(nodeId, {
            version_id: targetSummary.version_id,
          });
          if (cancelled) return;
          patchNodeStudyState(nodeId, { activeVersion: activated });
          await refreshVersionHistoryRef.current(nodeId);
          await refreshMentorUiStateRef.current(nodeId, targetSummary.version_id);
        } catch {
          /* non-critical */
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    node?.node_id,
    isMentor,
    currentPage,
    isGenerating,
    isLoadingVersions,
    studyMaterialContent,
    versionHistory,
    archivedVersionHistory.length,
    patchNodeStudyState,
    shouldShowHistoryHub,
    mentorUiState,
  ]);

  // Refresh mentor UI when returning to study material (e.g. after publishing a quiz)
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    void refreshMentorUiStateRef.current(node.node_id, viewingVersionId);
  }, [node?.node_id, isMentor, currentPage, viewingVersionId]);

  // Load delete/regenerate eligibility whenever material exists for this node
  useEffect(() => {
    if (!node || !isMentor) return;
    if (!hasTriggeredGeneration && !mentorUiState?.has_versions) return;
    void refreshClearDraftsEligibility(node.node_id);
  }, [
    node?.node_id,
    hasTriggeredGeneration,
    isMentor,
    mentorUiState?.has_versions,
    refreshClearDraftsEligibility,
  ]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const extractErrorDetail = (err: unknown): string => {
    const e = err as {
      response?: { data?: string | { detail?: string | { message?: string; error_code?: string } } };
      message?: string;
    };
    if (typeof e?.response?.data === "string") return e.response.data;
    const detail = e?.response?.data?.detail;
    if (typeof detail === "object" && detail?.message) return detail.message;
    return (typeof detail === "string" ? detail : undefined) ?? e?.message ?? "Request failed.";
  };

  const isEspaceNotPublishedError = (err: unknown): boolean => {
    const e = err as { response?: { data?: { detail?: { error_code?: string } } } };
    return e?.response?.data?.detail?.error_code === "ESPACE_NOT_PUBLISHED";
  };

  const isPublishTransactionError = (err: unknown): boolean => {
    const e = err as { response?: { data?: { detail?: { error_code?: string } } } };
    return e?.response?.data?.detail?.error_code === "PUBLISH_TRANSACTION_FAILED";
  };

  const isUnpublishTransactionError = (err: unknown): boolean => {
    const e = err as { response?: { data?: { detail?: { error_code?: string } } } };
    return e?.response?.data?.detail?.error_code === "UNPUBLISH_TRANSACTION_FAILED";
  };

  const publishSuccessToast = (version: StudyMaterialVersionOut, preview: StudyMaterialPublishPreviewOut | null) => {
    if (preview?.is_republishing_older) {
      return `${version.display_label} is now live for students.`;
    }
    if (preview?.is_replacing_live_version && !preview.is_republishing_older) {
      return `${version.display_label} replaced the live version.`;
    }
    return `${version.display_label} is now live for students.`;
  };

  const finalizeVersionMutation = async (version: StudyMaterialVersionOut) => {
    if (!node) return null;
    const nodeId = node.node_id;
    const versionLists = await refreshVersionHistory(nodeId);
    const activeFromServer = await studyMaterialService.getActiveVersion(nodeId);
    patchNodeStudyState(nodeId, {
      activeVersion: activeFromServer,
      ...(viewingVersionId === version.version_id
        ? { studyMaterialContent: version.content }
        : {}),
    });
    await refreshMentorUiStateRef.current(nodeId, viewingVersionId);
    onMentorProgressRefreshRef.current?.();
    return versionLists;
  };

  const handlePublishVersion = async (versionId: string) => {
    if (!node || isPublishingVersion) return;
    setPublishTransactionError(null);
    try {
      const preview = await studyMaterialService.previewPublish(node.node_id, versionId);
      if (preview.requires_confirmation) {
        setPendingPublishVersionId(versionId);
        setPublishPreview(preview);
        return;
      }
      setIsPublishingVersion(true);
      const version = await studyMaterialService.publish(node.node_id, { version_id: versionId });
      await finalizeVersionMutation(version);
      toast.success(publishSuccessToast(version, preview));
    } catch (err) {
      if (isEspaceNotPublishedError(err)) {
        setShowEspaceNotPublishedModal(true);
      } else {
        toast.error(extractErrorDetail(err));
      }
    } finally {
      setIsPublishingVersion(false);
    }
  };

  const confirmPublish = async (supersededRetentionMode?: RetentionMode) => {
    if (!node || !pendingPublishVersionId || isPublishingVersion) return;
    setIsPublishingVersion(true);
    setPublishTransactionError(null);
    const previewForToast = publishPreview;
    try {
      const version = await studyMaterialService.publish(node.node_id, {
        version_id: pendingPublishVersionId,
        ...(supersededRetentionMode
          ? { superseded_retention_mode: supersededRetentionMode }
          : {}),
      });
      setPublishPreview(null);
      setPendingPublishVersionId(null);
      await finalizeVersionMutation(version);
      toast.success(publishSuccessToast(version, previewForToast));
    } catch (err) {
      if (isPublishTransactionError(err)) {
        setPublishTransactionError(
          "Something went wrong. No changes were made. Please try again."
        );
      } else if (isEspaceNotPublishedError(err)) {
        setPublishPreview(null);
        setShowEspaceNotPublishedModal(true);
      } else {
        toast.error(extractErrorDetail(err));
      }
    } finally {
      setIsPublishingVersion(false);
    }
  };

  const closePublishModal = () => {
    if (isPublishingVersion) return;
    setPublishPreview(null);
    setPendingPublishVersionId(null);
    setPublishTransactionError(null);
  };

  const handleUnpublishVersion = async (versionId: string) => {
    if (!node || isUnpublishingVersion) return;
    setUnpublishTransactionError(null);
    try {
      const preview = await studyMaterialService.previewUnpublish(node.node_id, versionId);
      setPendingUnpublishVersionId(versionId);
      setUnpublishPreview(preview);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    }
  };

  const confirmUnpublish = async (retentionMode: RetentionMode) => {
    if (!node || !pendingUnpublishVersionId || isUnpublishingVersion) return;
    setIsUnpublishingVersion(true);
    setUnpublishTransactionError(null);
    try {
      const version = await studyMaterialService.unpublish(node.node_id, {
        version_id: pendingUnpublishVersionId,
        retention_mode: retentionMode,
      });
      setUnpublishPreview(null);
      setPendingUnpublishVersionId(null);
      const versionLists = await finalizeVersionMutation(version);
      const nodeId = node.node_id;
      const uiState = await studyMaterialService.getMentorUiState(nodeId, null);
      const willShowHistoryHub = Boolean(
        versionLists &&
          computeShouldShowHistoryHub(versionLists.history, versionLists.archived, uiState)
      );

      if (willShowHistoryHub) {
        setViewingVersionId(null);
        setShowArchivedPanel(false);
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          studyMaterialContent: null,
        });
      } else {
        setViewingVersionId(version.version_id);
        if (retentionMode === "keep_for_review") {
          setShowArchivedPanel(false);
          setStudentArchiveExpanded(true);
        }
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          studyMaterialContent: version.content,
        });
      }
      toast.success(`${version.display_label} removed from students.`);
    } catch (err) {
      if (isUnpublishTransactionError(err)) {
        setUnpublishTransactionError(
          "Something went wrong. No changes were made. Please try again."
        );
      } else {
        toast.error(extractErrorDetail(err));
      }
    } finally {
      setIsUnpublishingVersion(false);
    }
  };

  const closeUnpublishModal = () => {
    if (isUnpublishingVersion) return;
    setUnpublishPreview(null);
    setPendingUnpublishVersionId(null);
    setUnpublishTransactionError(null);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Backend-truth guard: an unresolved paused or failed run must be resumed or
  // deleted explicitly — never silently superseded by a fresh generate.
  // Returns true (and routes the mentor to Continue / Delete UI) when such a run
  // exists, so callers abort. Closes the race where a mentor clicks
  // Generate on page 1 right after a reload, before recovery rehydrates paused state.
  const routeToUnresolvedRunIfAny = async (nodeId: string): Promise<boolean> => {
    try {
      const active = await generationJobService.getActiveRun(nodeId, "study_material");
      if (active?.run_id && active.status === "paused") {
        generatingNodeIds.delete(nodeId);
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...patchForGenerationJobPaused(active.run_id, "study_material"),
        });
        if (isViewingNode(nodeId)) {
          setProcessingLabel(null);
        }
        return true;
      }
      if (active?.run_id && active.status === "failed") {
        generatingNodeIds.delete(nodeId);
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...patchForGenerationJobFailure(
            new GenerationJobFailedError("Generation failed.", active.run_id),
            active.run_id,
            "study_material",
          ),
        });
        if (isViewingNode(nodeId)) {
          setProcessingLabel(null);
        }
        return true;
      }
    } catch {
      /* non-critical — fall through and let the normal generate path proceed */
    }
    return false;
  };

  const handleGenerateStudyMaterial = async () => {
    if (!node || isGenerating) return;
    const nodeId = node.node_id;
    const usedExternalResearch = Boolean(
      (usesControlledExternalResearch
        ? externalResearchEnabledProp
        : externalResearchByNode[nodeId]) && !referenceMaterial,
    );
    generatingNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      hasTriggeredGeneration: true,
      currentPage: 2,
      isGenerating: true,
      ...patchForGenerationJobStart(),
    });
    setProcessingLabel("Generating study material");
    try {
      if (await routeToUnresolvedRunIfAny(nodeId)) return;
      await generationJobService.waitForResourceIdle(nodeId);
      // Re-check: a run that was still winding down (RUNNING) may have settled to
      // PAUSED while we waited. Never supersede it — route the mentor to resume/delete.
      if (await routeToUnresolvedRunIfAny(nodeId)) return;
      const { result, progress } = await generationJobService.runJob(
        () =>
          studyMaterialService.startGenerate(nodeId, {
            reference_material_id: referenceMaterial?.material_id ?? null,
            external_research_enabled: usedExternalResearch,
          }),
        (progressUpdate) => {
          latestRunId = progressUpdate.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progressUpdate));
        },
      );
      if (progress.status === "paused") {
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...patchForGenerationJobPaused(progress.session_id, "study_material"),
        });
        return;
      }
      if (!result) throw new Error("Study material generation completed without a result.");
      const version = result.study_material_generate as StudyMaterialVersionOut | null | undefined;
      if (!version) throw new Error("Study material generation returned no version.");
      applyVersion(nodeId, version);
      if (isViewingNode(nodeId)) {
        await refreshVersionHistory(nodeId);
        await refreshMentorUiStateRef.current(nodeId, null);
        await refreshExternalSourcesAfterGenerate(usedExternalResearch);
      }
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      toast.success(`Study material saved as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      const failure = patchForGenerationJobFailure(err, latestRunId, "study_material");
      if (failure.generationRunFailed) {
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...failure,
        });
      } else {
        patchNodeStudyState(nodeId, {
          currentPage: 1,
          hasTriggeredGeneration: false,
          ...failure,
        });
      }
    } finally {
      generatingNodeIds.delete(nodeId);
      if (isViewingNode(nodeId)) {
        setProcessingLabel(null);
      }
    }
  };

  const handleRegenerateStudyMaterialFresh = async () => {
    if (!node || isGenerating || isDeletingDrafts) return;
    const nodeId = node.node_id;
    const usedExternalResearch = Boolean(
      (usesControlledExternalResearch
        ? externalResearchEnabledProp
        : externalResearchByNode[nodeId]) && !referenceMaterial,
    );
    generatingNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    setIsDeletingDrafts(true);
    setShowRegenerateConfirmModal(false);
    setFeedbackModalMode(null);
    setIsManualEditMode(false);
    setViewingVersionId(null);
    setVersionHistory([]);
    setArchivedVersionHistory([]);
    setShowArchivedPanel(false);
    setInstructionBannerDismissedByNode((dismissed) => {
      if (!(nodeId in dismissed)) return dismissed;
      const next = { ...dismissed };
      delete next[nodeId];
      return next;
    });
    patchNodeStudyState(nodeId, {
      hasTriggeredGeneration: true,
      currentPage: 2,
      isGenerating: true,
      studyMaterialContent: null,
      activeVersion: null,
      ...patchForGenerationJobStart(),
    });
    setProcessingLabel("Generating study material");
    try {
      // The finally below resets isDeletingDrafts; just abort if a paused run exists.
      if (await routeToUnresolvedRunIfAny(nodeId)) return;
      await generationJobService.waitForResourceIdle(nodeId);
      // Re-check after the wait: a winding-down run may have just settled to PAUSED.
      if (await routeToUnresolvedRunIfAny(nodeId)) return;
      await studyMaterialService.clearAllDrafts(nodeId);
      const { result, progress } = await generationJobService.runJob(
        () =>
          studyMaterialService.startGenerate(nodeId, {
            reference_material_id: referenceMaterial?.material_id ?? null,
            external_research_enabled: usedExternalResearch,
          }),
        (progressUpdate) => {
          latestRunId = progressUpdate.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progressUpdate));
        },
      );
      if (progress.status === "paused") {
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...patchForGenerationJobPaused(progress.session_id, "study_material"),
        });
        return;
      }
      if (!result) throw new Error("Study material generation completed without a result.");
      const version = result.study_material_generate as StudyMaterialVersionOut | null | undefined;
      if (!version) throw new Error("Study material generation returned no version.");
      applyVersion(nodeId, version);
      if (isViewingNode(nodeId)) {
        await refreshVersionHistory(nodeId);
        // Refresh mentor UI state so publish/unpublish flags reflect the freshly
        // generated (never-published) version. Without this the stale state from
        // the deleted versions bleeds through and shows a phantom "Unpublish"
        // button on the new version, which then 409s when clicked.
        await refreshMentorUiStateRef.current(nodeId, null);
        await refreshExternalSourcesAfterGenerate(usedExternalResearch);
      }
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
      toast.success(`Study material regenerated as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      const failure = patchForGenerationJobFailure(err, latestRunId, "study_material");
      if (failure.generationRunFailed) {
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...failure,
        });
      } else {
        patchNodeStudyState(nodeId, {
          currentPage: 1,
          isGenerating: false,
          hasTriggeredGeneration: false,
          studyMaterialContent: null,
          activeVersion: null,
          ...failure,
        });
        if (isViewingNode(nodeId)) {
          await refreshClearDraftsEligibility(nodeId);
        }
      }
    } finally {
      generatingNodeIds.delete(nodeId);
      setIsDeletingDrafts(false);
      if (isViewingNode(nodeId)) {
        setProcessingLabel(null);
      }
    }
  };

  const runFeedbackAction = async (mode: StudyMaterialFeedbackMode, feedback: string) => {
    if (!node || isGenerating) return;
    if (isSourcePdfDeleted(activeVersion, referenceMaterial, isLoadingGenerationSource)) {
      toast.error(SOURCE_PDF_DELETED_BLOCK_REASON);
      return;
    }
    const nodeId = node.node_id;
    generatingNodeIds.add(nodeId);
    let latestRunId: string | null = null;
    patchNodeStudyState(nodeId, {
      isGenerating: true,
      currentPage: 2,
      ...patchForGenerationJobStart(),
    });
    if (isViewingNode(nodeId)) {
      setFeedbackModalMode(null);
    }
    setProcessingLabel(mode === "regenerate" ? "Regenerating study material" : "Improving study material");
    try {
      await generationJobService.waitForResourceIdle(nodeId);
      const { result, progress } = await generationJobService.runJob(
        () => (mode === "regenerate"
          ? studyMaterialService.startRegenerate(nodeId, {
            mentor_regeneration_goal: feedback,
          })
          : studyMaterialService.startImprove(nodeId, {
            mentor_feedback: feedback,
          })),
        (progressUpdate) => {
          latestRunId = progressUpdate.session_id;
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(progressUpdate));
        },
      );
      if (progress.status === "paused") {
        patchNodeStudyState(nodeId, {
          currentPage: 2,
          hasTriggeredGeneration: true,
          ...patchForGenerationJobPaused(progress.session_id, "study_material"),
        });
        return;
      }
      if (!result) throw new Error("Study material feedback completed without a result.");
      const res = result.study_material_feedback as StudyMaterialFeedbackResponse | null | undefined;
      if (!res) throw new Error("Study material feedback returned no result.");
      if (!res.has_new_version) {
        toast(res.status_message || "Feedback was too vague to apply.", {
          icon: "⚠️",
          style: {
            background: "var(--color-warning-subtle)",
            color: "var(--color-warning)",
            border: "1px solid var(--color-warning)",
          },
        });
      } else {
        if (res.new_version) {
          applyVersion(nodeId, res.new_version);
          if (isViewingNode(nodeId)) {
            await refreshVersionHistory(nodeId);
            await refreshMentorUiStateRef.current(nodeId, null);
          }
          toast.success(`Saved as ${res.new_version.display_label}.`);
        }
      }
      if (isViewingNode(nodeId)) {
        setFeedbackModalMode(null);
      }
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
    } catch (err) {
      toast.error(extractErrorDetail(err));
      const failure = patchForGenerationJobFailure(err, latestRunId, "study_material");
      patchNodeStudyState(nodeId, failure.generationRunFailed
        ? { currentPage: 2, hasTriggeredGeneration: true, ...failure }
        : failure);
    } finally {
      generatingNodeIds.delete(nodeId);
      if (isViewingNode(nodeId)) {
        setProcessingLabel(null);
      }
    }
  };

  const applyStudyMaterialRunResult = async (
    nodeId: string,
    result: Awaited<ReturnType<typeof generationJobService.getResult>>,
  ) => {
    if (result.study_material_generate) {
      const version = result.study_material_generate as unknown as StudyMaterialVersionOut;
      applyVersion(nodeId, version);
      if (isViewingNode(nodeId)) {
        await refreshVersionHistory(nodeId);
        await refreshMentorUiStateRef.current(nodeId, null);
      }
      toast.success(`Study material saved as ${version.display_label}.`);
      return;
    }
    const res = result.study_material_feedback as StudyMaterialFeedbackResponse | null | undefined;
    if (res?.new_version) {
      applyVersion(nodeId, res.new_version);
      if (isViewingNode(nodeId)) {
        await refreshVersionHistory(nodeId);
        await refreshMentorUiStateRef.current(nodeId, null);
      }
      toast.success(`Saved as ${res.new_version.display_label}.`);
    }
  };

  const handleResumeFailedGeneration = async () => {
    if (!node || isResumingFailedGeneration || failedGenerationPipeline !== "study_material") return;
    if (!generationRunFailed && !generationRunPaused) return;
    const runId = activeGenerationRunId ?? generationProgressSessionId;
    if (!runId) return;

    const nodeId = node.node_id;
    generatingNodeIds.add(nodeId);
    setIsResumingFailedGeneration(true);
    // Drop the paused checklist seed so Continue cannot paint a stale step list.
    // Panel shows "Resuming…" until onResumeLive flips to the normal progress UI.
    patchNodeStudyState(nodeId, {
      generationRunFailed: false,
      generationRunPaused: false,
      isGenerating: true,
      generationProgressSessionId: runId,
      activeGenerationRunId: runId,
      generationProgress: null,
    });
    try {
      const { result, progress } = await generationJobService.resumeJob(
        runId,
        (update) => {
          patchNodeStudyState(nodeId, patchGenerationProgressUpdate(update));
        },
        {
          onResumeLive: () => {
            setIsResumingFailedGeneration(false);
            if (isViewingNode(nodeId)) {
              setProcessingLabel("Generating study material");
            }
          },
        },
      );
      if (progress.status === "paused") {
        patchPausedGenerationState(nodeId, runId);
        return;
      }
      if (!result) throw new Error("Resume completed without a study material result.");
      await applyStudyMaterialRunResult(nodeId, result);
      patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
    } catch (err) {
      toast.error(extractResumeErrorDetail(err));
      patchNodeStudyState(nodeId, {
        currentPage: 2,
        hasTriggeredGeneration: true,
        ...patchForGenerationJobFailure(err, runId, "study_material"),
      });
    } finally {
      generatingNodeIds.delete(nodeId);
      setIsResumingFailedGeneration(false);
      if (isViewingNode(nodeId)) {
        setProcessingLabel(null);
      }
    }
  };

  const patchPausedGenerationState = useCallback((nodeId: string, runId: string) => {
    generatingNodeIds.delete(nodeId);
    patchNodeStudyState(nodeId, {
      currentPage: 2,
      hasTriggeredGeneration: true,
      ...patchForGenerationJobPaused(runId, "study_material"),
    });
    if (isViewingNode(nodeId)) {
      setProcessingLabel(null);
    }
  }, [patchNodeStudyState]);

  const handlePauseGeneration = async () => {
    if (!node || isPausingGeneration || isAbandoningGeneration) return;
    const runId = activeGenerationRunId ?? generationProgressSessionId;
    if (!runId) return;

    const nodeId = node.node_id;
    patchNodeStudyState(nodeId, { isPausingGeneration: true });
    try {
      await generationJobService.pauseRun(runId);
      // The run row is PAUSED (resumable) the instant pauseRun returns. Show the
      // paused / resume UI immediately instead of polling until the worker winds
      // down the current step (which can take 10-20s). This keeps the mentor on
      // Material with Continue / Delete run and blocks an accidental re-generate.
      patchPausedGenerationState(nodeId, runId);
    } catch (pauseErr) {
      // Pause fails when the run already settled (completed) or was paused by a
      // concurrent poller — reconcile from the run row before surfacing an error.
      try {
        const run = await generationJobService.getRun(runId);
        if (run.status === "completed") {
          const result = await generationJobService.getResult(runId);
          await applyStudyMaterialRunResult(nodeId, result);
          patchNodeStudyState(nodeId, patchForGenerationJobSuccess());
          return;
        }
        if (run.status === "paused") {
          patchPausedGenerationState(nodeId, runId);
          return;
        }
      } catch {
        /* fall through to the error toast below */
      }
      toast.error(extractErrorDetail(pauseErr));
      patchNodeStudyState(nodeId, { isPausingGeneration: false });
    } finally {
      generatingNodeIds.delete(nodeId);
      if (isViewingNode(nodeId)) {
        setProcessingLabel(null);
      }
    }
  };

  const handleAbandonGeneration = async () => {
    if (!node || isAbandoningGeneration) return;
    const runId = activeGenerationRunId ?? generationProgressSessionId;
    if (!runId) return;

    const nodeId = node.node_id;
    patchNodeStudyState(nodeId, { isAbandoningGeneration: true });
    try {
      await generationJobService.abandonRun(runId);
      await generationJobService.waitForResourceIdle(nodeId);
      await resetStudyMaterialAfterAbandon(nodeId);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      patchNodeStudyState(nodeId, { isAbandoningGeneration: false });
    } finally {
      if (isViewingNode(nodeId)) {
        setProcessingLabel(null);
      }
    }
  };

  const handleManualEditSave = async (content: string) => {
    if (!node || isSavingManualEdit) return;
    const nodeId = node.node_id;
    setIsSavingManualEdit(true);
    try {
      const version = await studyMaterialService.manualEdit(nodeId, { content });
      applyVersion(nodeId, version);
      await refreshVersionHistory(nodeId);
      await refreshMentorUiStateRef.current(nodeId, null);
      setIsManualEditMode(false);
      toast.success(`Manual edit saved as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsSavingManualEdit(false);
    }
  };

  const handleSelectVersion = async (versionId: string) => {
    if (!node) return;
    const nodeId = node.node_id;
    const summary = findVersionSummary(versionId);

    if (summary?.is_archived) {
      setShowArchivedPanel(true);
    } else if (summary?.mentor_display_badge === "Previous for students") {
      setShowArchivedPanel(false);
      setStudentArchiveExpanded(true);
    }
    setViewingVersionId(versionId);
    try {
      const version = await studyMaterialService.getVersion(nodeId, versionId);
      patchNodeStudyState(nodeId, { studyMaterialContent: version.content });
      await refreshMentorUiStateRef.current(nodeId, versionId);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    }

    // Silently activate the selected version so Regenerate/Improve/Edit are never blocked
    // (including versions opened from the history hub or student archive).
    if (shouldSilentlyActivateOnSelect(summary)) {
      try {
        const activated = await studyMaterialService.activate(nodeId, { version_id: versionId });
        patchNodeStudyState(nodeId, { activeVersion: activated });
        await refreshVersionHistoryRef.current(nodeId);
        await refreshMentorUiStateRef.current(nodeId, versionId);
      } catch {
        // Non-critical — version is still viewable, edit buttons may remain disabled.
      }
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (!node || isActivatingVersion) return;
    const nodeId = node.node_id;
    setIsActivatingVersion(true);
    try {
      const version = await studyMaterialService.activate(nodeId, {
        version_id: versionId,
      });
      applyVersion(nodeId, version, true);
      await refreshVersionHistory(nodeId);
      await refreshMentorUiStateRef.current(nodeId, null);
      toast.success(`${version.display_label} is now your working draft.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsActivatingVersion(false);
    }
  };

  const handleAcceptFailedQc = useCallback(async () => {
    if (!node || !activeVersion?.version_id) return;
    const nodeId = node.node_id;
    try {
      const updated = await studyMaterialService.dismissQcWarning(
        nodeId,
        activeVersion.version_id,
      );
      patchNodeStudyState(nodeId, {
        activeVersion: updated,
        studyMaterialContent: updated.content,
      });
    } catch (err) {
      toast.error(extractErrorDetail(err));
    }
  }, [node, activeVersion?.version_id, patchNodeStudyState]);

  const handleBackToHistory = useCallback(() => {
    if (!node) return;
    setViewingVersionId(null);
    setShowArchivedPanel(false);
    patchNodeStudyState(node.node_id, { studyMaterialContent: null });
  }, [node, patchNodeStudyState]);

  const handleReturnToActiveDraft = async () => {
    if (!node) return;
    if (isHistoryDetailView) {
      handleBackToHistory();
      return;
    }
    if (!activeVersion) return;
    setViewingVersionId(null);
    setShowArchivedPanel(false);
    patchNodeStudyState(node.node_id, { studyMaterialContent: activeVersion.content });
  };

  const handleArchiveVersion = async (versionId: string) => {
    if (!node || isArchivingVersion) return;
    const nodeId = node.node_id;
    setIsArchivingVersion(true);
    try {
      await studyMaterialService.archive(nodeId, versionId);
      const versionLists = await refreshVersionHistory(nodeId);

      setViewingVersionId(null);
      setShowArchivedPanel(false);

      if (!versionLists) {
        await refreshMentorUiStateRef.current(nodeId, null);
        toast.success("Draft moved to archive.");
        return;
      }

      const uiState = await studyMaterialService.getMentorUiState(nodeId, null);
      const willShowHistoryHub = computeShouldShowHistoryHub(
        versionLists.history,
        versionLists.archived,
        uiState,
      );

      if (willShowHistoryHub) {
        patchNodeStudyState(nodeId, {
          activeVersion: null,
          studyMaterialContent: null,
        });
      } else {
        const partitions = partitionHistoryVersions(
          versionLists.history,
          versionLists.archived,
        );
        const remainingDrafts = partitions.workspaceDrafts.filter((v) => !v.is_archived);

        let nextVersion = await studyMaterialService.getActiveVersion(nodeId);
        if (!nextVersion && remainingDrafts.length > 0) {
          nextVersion = await studyMaterialService.activate(nodeId, {
            version_id: remainingDrafts[0].version_id,
          });
          await refreshVersionHistory(nodeId);
        }

        if (nextVersion) {
          patchNodeStudyState(nodeId, {
            activeVersion: nextVersion,
            studyMaterialContent: nextVersion.content,
          });
        } else {
          patchNodeStudyState(nodeId, {
            activeVersion: null,
            studyMaterialContent: null,
          });
        }
      }

      await refreshMentorUiStateRef.current(nodeId, null);
      toast.success("Draft moved to archive.");
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsArchivingVersion(false);
    }
  };

  const handleUnarchiveVersion = async (versionId: string) => {
    if (!node || isUnarchivingVersion) return;
    const nodeId = node.node_id;
    setIsUnarchivingVersion(true);
    try {
      const version = await studyMaterialService.unarchive(nodeId, versionId);
      await refreshVersionHistory(nodeId);
      setShowArchivedPanel(false);
      setViewingVersionId(null);
      patchNodeStudyState(nodeId, {
        activeVersion: version,
        studyMaterialContent: version.content,
        hasTriggeredGeneration: true,
      });
      await refreshMentorUiStateRef.current(nodeId, null);
      toast.success("Draft restored to your workspace.");
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsUnarchivingVersion(false);
    }
  };

  const handleArchiveCurrentVersion = () => {
    const targetId = viewingVersionId ?? activeVersion?.version_id;
    if (targetId) void handleArchiveVersion(targetId);
  };

  const handleUnarchiveCurrentVersion = () => {
    const targetId = viewingVersionId ?? activeVersion?.version_id;
    if (targetId) void handleUnarchiveVersion(targetId);
  };

  const handleDownloadDisplayedVersionPdf = async () => {
    const targetId = viewingVersionId ?? activeVersion?.version_id;
    if (!node?.node_id || !targetId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const safeTitle =
        (node.title || "study-material").replace(/[^\w\s-]/g, "").trim() || "study-material";
      await studyMaterialService.downloadVersionPdf(node.node_id, targetId, `${safeTitle}.pdf`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const expandStudentArchive = useCallback(() => {
    setShowArchivedPanel(false);
    setStudentArchiveExpanded(true);
    setFocusStudentArchiveNonce((n) => n + 1);
  }, []);

  const handleClearAllDrafts = async () => {
    if (!node || isDeletingDrafts) return;
    setIsDeletingDrafts(true);
    try {
      const result = await studyMaterialService.clearAllDrafts(node.node_id);
      setShowDeleteDraftModal(false);
      setFeedbackModalMode(null);
      setIsManualEditMode(false);
      setViewingVersionId(null);
      setVersionHistory([]);
      setArchivedVersionHistory([]);
      setShowArchivedPanel(false);
      setClearDraftsEligibility(null);
      // Clear stale mentor UI state so publish/unpublish flags from the just-
      // deleted versions don't bleed through while the user is on page 1.
      setMentorUiState(null);
      patchNodeStudyState(node.node_id, {
        currentPage: 1,
        hasTriggeredGeneration: false,
        studyMaterialContent: null,
        activeVersion: null,
      });
      await refreshMentorUiStateRef.current(node.node_id, null);
      toast.success(
        result.discarded_count === 1
          ? "Unpublished draft discarded. Live content and student archive are unchanged."
          : `${result.discarded_count} unpublished drafts discarded. Live content and student archive are unchanged.`
      );
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsDeletingDrafts(false);
    }
  };

  const handlePublishCurrentVersion = () => {
    const targetId = viewingVersionId ?? activeVersion?.version_id;
    if (targetId) void handlePublishVersion(targetId);
  };

  const handleUnpublishCurrentVersion = () => {
    const targetId = viewingVersionId ?? activeVersion?.version_id;
    if (targetId) void handleUnpublishVersion(targetId);
  };

  const dismissInstructionChangeBanner = useCallback(() => {
    if (!node) return;
    const instruction =
      mentorUiState?.current_effective_instruction ?? currentEffectiveInstruction;
    setInstructionBannerDismissedByNode((dismissed) => ({
      ...dismissed,
      [node.node_id]: instruction,
    }));
  }, [node, mentorUiState?.current_effective_instruction, currentEffectiveInstruction]);

  const handleKeepExistingDraftsAfterMove = () => {
    dismissInstructionChangeBanner();
  };

  const handleUseNewInstructions = () => {
    // Dismiss the banner so it does not re-appear on page 1 and so the page
    // remains scrollable.  The user has acknowledged the change and wants to
    // regenerate with the updated instructions.
    dismissInstructionChangeBanner();
    setCurrentPage(1);
  };

  const openRefModalManage = useCallback((options?: { focusDropzone?: boolean }) => {
    setRefModalMode("manage");
    setRefModalFocusDropzone(options?.focusDropzone ?? false);
    setShowRefModal(true);
  }, []);

  const openRefModalView = useCallback(() => {
    setRefModalMode("view");
    setRefModalFocusDropzone(false);
    setShowRefModal(true);
  }, []);

  const handleRequestReplaceSource = useCallback(() => {
    setShowRefModal(false);
    setCurrentPage(1);
    setRefModalMode("manage");
    setRefModalFocusDropzone(true);
    setShowRefModal(true);
  }, [setCurrentPage]);

  const dismissSourceDocMismatchBanner = useCallback(() => {
    if (!node || !referenceMaterial) return;
    setSourceDocMismatchDismissedByNode((dismissed) => ({
      ...dismissed,
      [node.node_id]: referenceMaterial.material_id,
    }));
  }, [node, referenceMaterial]);

  const dismissExternalResearchFailSoftBanner = useCallback(() => {
    if (!node || !activeVersion?.version_id) return;
    setExternalResearchFailSoftDismissedByNode((dismissed) => ({
      ...dismissed,
      [node.node_id]: activeVersion.version_id,
    }));
  }, [node, activeVersion?.version_id]);

  const openFeedbackModal = useCallback(
    (mode: StudyMaterialFeedbackMode) => {
      if (isSourcePdfDeleted(activeVersion, referenceMaterial, isLoadingGenerationSource)) {
        toast.error(SOURCE_PDF_DELETED_BLOCK_REASON);
        return;
      }
      setFeedbackModalMode(mode);
    },
    [activeVersion, referenceMaterial, isLoadingGenerationSource]
  );

  // ── Computed values ───────────────────────────────────────────────────────

  const canAccessStudyMaterial = mentorUiState?.can_access_study_material ?? false;
  const hasWorkspaceStudyMaterial = Boolean(mentorUiState?.has_workspace_versions);
  const canAccessQuiz = mentorUiState?.can_access_quiz ?? false;
  const displayedVersionId = viewingVersionId ?? activeVersion?.version_id ?? null;
  const displayedVersionSummary = findVersionSummary(displayedVersionId);
  const candidateVersionActions = mentorUiState?.displayed_version_actions;
  const versionActions =
    candidateVersionActions?.version_id === displayedVersionId
      ? candidateVersionActions
      : null;
  const isViewingArchivedVersion = versionActions?.is_viewing_archived ?? false;
  const isViewingNonActiveVersion = versionActions?.is_viewing_non_active ?? false;
  // Optimistic fallback: while mentorUiState is loading (null), unblock the
  // edit/improve/regenerate buttons if we already know the active version is
  // an unpublished draft and the user is not viewing a historical version.
  // This eliminates the brief "greyed-out" flash after Generate All navigates
  // to a material page before the async UI-state refresh completes.
  const canEditActiveDraftOptimistic =
    isLoadingMentorUiState &&
    mentorUiState === null &&
    viewingVersionId === null &&
    activeVersion !== null &&
    activeVersion.lifecycle_status === "draft";
  const canEditActiveDraft =
    versionActions?.can_edit_active_draft ?? canEditActiveDraftOptimistic;
  const canArchiveDisplayedVersion = Boolean(
    versionActions?.can_archive &&
    displayedVersionSummary?.lifecycle_status === "draft"
  );
  const canPublishDisplayedVersion = versionActions?.can_publish ?? false;
  const canUnpublishDisplayedVersion = versionActions?.can_unpublish ?? false;
  const publishButtonLabel = versionActions?.publish_button_label ?? "Make live for students";
  const publishDisabledTooltip = versionActions?.publish_disabled_tooltip ?? null;
  const unpublishButtonLabel = versionActions?.unpublish_button_label ?? "Remove from students";
  const unpublishTooltip = versionActions?.unpublish_tooltip ?? null;
  const unpublishDisabledTooltip = versionActions?.unpublish_disabled_tooltip ?? null;
  const publishedVersionId = mentorUiState?.published_version_id ?? null;
  const canClearAllDrafts = Boolean(clearDraftsEligibility?.can_clear);
  const clearDraftsBlockReason = clearDraftsEligibility?.block_reason ?? undefined;
  const instructionBannerDismissedFor = node
    ? instructionBannerDismissedByNode[node.node_id]
    : undefined;
  const showInstructionChangeBanner = Boolean(
    mentorUiState?.instruction_changed_since_generation &&
    mentorUiState.current_effective_instruction !== instructionBannerDismissedFor
  );

  const sourceDocMismatch = Boolean(
    activeVersion?.reference_material_id != null &&
    referenceMaterial?.material_id != null &&
    activeVersion.reference_material_id !== referenceMaterial.material_id
  );

  const sourceDocMismatchDismissedFor = node
    ? sourceDocMismatchDismissedByNode[node.node_id]
    : undefined;

  const showSourceDocMismatchBanner = Boolean(
    sourceDocMismatch &&
    referenceMaterial?.material_id !== sourceDocMismatchDismissedFor
  );

  const sourcePdfDeleted = isSourcePdfDeleted(
    activeVersion,
    referenceMaterial,
    isLoadingGenerationSource
  );
  const canRegenerateOrImproveDraft = Boolean(canEditActiveDraft && !sourcePdfDeleted);

  const displayedVersionBaseLabel =
    displayedVersionSummary?.display_label ?? activeVersion?.display_label ?? null;

  const isDisplayedActiveWorkingDraft = Boolean(
    canEditActiveDraft &&
    !isViewingArchivedVersion &&
    !isViewingNonActiveVersion
  );

  const externalResearchFailSoftDismissedFor = node
    ? externalResearchFailSoftDismissedByNode[node.node_id]
    : undefined;
  const showExternalResearchFailSoftBanner = Boolean(
    isDisplayedActiveWorkingDraft &&
    activeVersion?.generation_outcome_detail?.external_research_fail_soft &&
    activeVersion.version_id !== externalResearchFailSoftDismissedFor
  );
  const externalResearchFailSoftMessage =
    activeVersion?.generation_outcome_detail?.message?.trim() ||
    EXTERNAL_RESEARCH_FAIL_SOFT_MESSAGE;

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    // Accessors
    currentPage,
    hasTriggeredGeneration,
    studyMaterialContent,
    activeVersion,
    isGenerating,
    generationProgressSessionId,
    activeGenerationRunId,
    generationRunFailed,
    failedGenerationPipeline,
    generationRunPaused,
    isResumingFailedGeneration,
    isPausingGeneration,
    isAbandoningGeneration,
    referenceMaterial,
    nodeMedia,
    isLoadingGenerationSource,
    isLoadingTopicResources,
    externalResearchEnabled,
    setExternalResearchEnabled,
    showExternalResearchFailSoftBanner,
    dismissExternalResearchFailSoftBanner,
    externalResearchFailSoftMessage,
    setCurrentPage,

    // State
    feedbackModalMode,
    setFeedbackModalMode,
    isManualEditMode,
    setIsManualEditMode,
    versionHistory,
    archivedVersionHistory,
    showArchivedPanel,
    setShowArchivedPanel,
    studentArchiveExpanded,
    focusStudentArchiveNonce,
    expandStudentArchive,
    setStudentArchiveExpanded,
    isLoadingVersions,
    viewingVersionId,
    isActivatingVersion,
    isPublishingVersion,
    isUnpublishingVersion,
    isArchivingVersion,
    isUnarchivingVersion,
    isDownloadingPdf,
    isSavingManualEdit,
    processingLabel,
    showDeleteDraftModal,
    setShowDeleteDraftModal,
    showRegenerateConfirmModal,
    setShowRegenerateConfirmModal,
    showRefModal,
    setShowRefModal,
    refModalMode,
    setRefModalMode,
    refModalFocusDropzone,
    setRefModalFocusDropzone,
    openRefModalManage,
    openRefModalView,
    handleRequestReplaceSource,
    sourceDocMismatch,
    showSourceDocMismatchBanner,
    dismissSourceDocMismatchBanner,
    sourcePdfDeleted,
    sourcePdfDeletedBlockReason: SOURCE_PDF_DELETED_BLOCK_REASON,
    canRegenerateOrImproveDraft,
    openFeedbackModal,
    showNodeMediaModal,
    setShowNodeMediaModal,
    isDeletingDrafts,
    clearDraftsEligibility,

    // Computed
    canAccessStudyMaterial,
    hasWorkspaceStudyMaterial,
    canAccessQuiz,
    displayedVersionId,
    displayedVersionSummary,
    displayedVersionBaseLabel,
    isDisplayedActiveWorkingDraft,
    isViewingArchivedVersion,
    isViewingNonActiveVersion,
    shouldShowHistoryHub,
    isHistoryHubView,
    isHistoryDetailView,
    historyPartitions,
    canEditActiveDraft,
    canArchiveDisplayedVersion,
    canPublishDisplayedVersion,
    canUnpublishDisplayedVersion,
    publishButtonLabel,
    publishDisabledTooltip,
    unpublishButtonLabel,
    unpublishTooltip,
    unpublishDisabledTooltip,
    publishedVersionId,
    canClearAllDrafts,
    clearDraftsBlockReason,
    showInstructionChangeBanner,
    mentorUiState,
    publishPreview,
    unpublishPreview,
    showEspaceNotPublishedModal,
    publishTransactionError,
    unpublishTransactionError,
    setShowEspaceNotPublishedModal,
    closePublishModal,
    closeUnpublishModal,
    confirmPublish,
    confirmUnpublish,

    // Handlers
    handleGenerateStudyMaterial,
    handlePauseGeneration,
    handleAbandonGeneration,
    handleResumeFailedGeneration,
    handleRegenerateStudyMaterialFresh,
    runFeedbackAction,
    handleManualEditSave,
    handleSelectVersion,
    handleActivateVersion,
    handleReturnToActiveDraft,
    handleBackToHistory,
    handleArchiveCurrentVersion,
    handleUnarchiveCurrentVersion,
    handleUnarchiveVersion,
    handleDownloadDisplayedVersionPdf,
    handleClearAllDrafts,
    handlePublishCurrentVersion,
    handleUnpublishCurrentVersion,
    handleKeepExistingDraftsAfterMove,
    handleUseNewInstructions,
    setReferenceMaterial,
    setReferenceMaterialForNode,
    refreshGenerationSource,
    refreshTopicResources,
    handleAcceptFailedQc,
  };
}
