import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { TopicContentPage } from "../../spaces/types/node.types";
import type {
  ReferenceMaterialOut,
  NodeMediaOut,
  RetentionMode,
  StudyMaterialClearDraftsEligibilityOut,
  StudyMaterialFeedbackMode,
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
import { createGenerationProgressSessionId } from "../../generation/services/generationProgressService";

// Re-export for consumers that import from this hook
export type { NodeStudyStatePatch, NodeStudyState };

export type RefModalMode = "manage" | "view";

/** Shown when a draft's frozen reference_material_id no longer has an active upload. */
export const SOURCE_PDF_DELETED_BLOCK_REASON =
  "The reference PDF for this draft was removed. Upload a new PDF, or discard drafts and generate fresh from page 1 without a reference document.";

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

interface UseStudyMaterialParams {
  node: NodeTreeNode | null;
  spaceId: string;
  spaceIsPublished?: boolean;
  isMentor: boolean;
  studyState?: NodeStudyState;
  onStudyStateChange?: (nodeId: string, patch: NodeStudyStatePatch) => void;
  onMentorProgressRefresh?: () => void;
  contentRefreshToken?: number;
}

export interface UseStudyMaterialReturn {
  // ── Convenient accessors (derived from props) ──────────────────────────
  currentPage: TopicContentPage;
  hasTriggeredGeneration: boolean;
  studyMaterialContent: string | null;
  activeVersion: StudyMaterialVersionOut | null;
  isGenerating: boolean;
  generationProgressSessionId: string | null;
  referenceMaterial: ReferenceMaterialOut | null;
  nodeMedia: NodeMediaOut[];
  isLoadingGenerationSource: boolean;
  isLoadingTopicResources: boolean;
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
  handleRegenerateStudyMaterialFresh: () => Promise<void>;
  runFeedbackAction: (mode: StudyMaterialFeedbackMode, feedback: string) => Promise<void>;
  handleManualEditSave: (content: string) => Promise<void>;
  handleSelectVersion: (versionId: string) => Promise<void>;
  handleActivateVersion: (versionId: string) => Promise<void>;
  handleReturnToActiveDraft: () => Promise<void>;
  handleArchiveCurrentVersion: () => void;
  handleUnarchiveCurrentVersion: () => void;
  handleUnarchiveVersion: (versionId: string) => Promise<void>;
  handleClearAllDrafts: () => Promise<void>;
  handlePublishCurrentVersion: () => void;
  handleUnpublishCurrentVersion: () => void;
  handleKeepExistingDraftsAfterMove: () => void;
  handleUseNewInstructions: () => void;
  setReferenceMaterial: (m: ReferenceMaterialOut | null) => void;
  setReferenceMaterialForNode: (nodeId: string, m: ReferenceMaterialOut | null) => void;
  refreshGenerationSource: () => Promise<void>;
  refreshTopicResources: () => Promise<void>;
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
  const [isUnarchivingVersion, setIsUnarchivingVersion] = useState(false);
  const [isSavingManualEdit, setIsSavingManualEdit] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState(false);
  /** Per-node: effective instruction the user dismissed the change banner for. */
  const [instructionBannerDismissedByNode, setInstructionBannerDismissedByNode] = useState<
    Record<string, string>
  >({});
  const prevEffectiveInstructionByNodeRef = useRef<Record<string, string>>({});
  const [clearDraftsEligibility, setClearDraftsEligibility] =
    useState<StudyMaterialClearDraftsEligibilityOut | null>(null);
  const [mentorUiState, setMentorUiState] =
    useState<StudyMaterialMentorUiStateOut | null>(null);
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
  const refreshVersionHistoryRef = useRef<(nodeId: string) => Promise<void>>(async () => {});
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
  const referenceMaterial = studyState?.referenceMaterial ?? null;
  const currentEffectiveInstruction = node?.effective_instruction ?? "";

  const setCurrentPage = (p: TopicContentPage) => {
    if (!node) return;
    patchNodeStudyState(node.node_id, { currentPage: p });
  };
  const setReferenceMaterialForNode = useCallback(
    (nodeId: string, m: ReferenceMaterialOut | null) => {
      patchNodeStudyState(nodeId, { referenceMaterial: m });
    },
    [patchNodeStudyState]
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
    } catch {
      /* non-critical */
    } finally {
      if (requestId === generationSourceRequestRef.current) {
        setIsLoadingGenerationSource(false);
      }
    }
  }, [node, isMentor, patchNodeStudyState]);

  const refreshTopicResources = useCallback(async () => {
    if (!node || !isMentor) return;
    setIsLoadingTopicResources(true);
    try {
      const mediaRes = await referenceMaterialService.listNodeMedia(node.node_id);
      setNodeMedia(mediaRes.items);
    } catch {
      /* non-critical */
    } finally {
      setIsLoadingTopicResources(false);
    }
  }, [node, isMentor]);

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

  const refreshVersionHistory = useCallback(async (nodeId: string) => {
    const requestId = ++versionHistoryRequestRef.current;
    setIsLoadingVersions(true);
    try {
      const [history, archived] = await Promise.all([
        studyMaterialService.listVersions(nodeId, { archived: false }),
        studyMaterialService.listVersions(nodeId, { archived: true }),
      ]);
      if (requestId !== versionHistoryRequestRef.current) return;
      setVersionHistory(history.versions);
      setArchivedVersionHistory(archived.versions);
      await refreshClearDraftsEligibility(nodeId);
    } catch {
      /* non-critical */
    } finally {
      if (requestId === versionHistoryRequestRef.current) {
        setIsLoadingVersions(false);
      }
    }
  }, [refreshClearDraftsEligibility]);

  refreshVersionHistoryRef.current = refreshVersionHistory;

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
    setNodeMedia([]);
    setProcessingLabel(null);
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

  // Recover from stale isGenerating when returning to a node whose generation
  // finished while another node was selected (state updates must target node id).
  useEffect(() => {
    if (!node || !isMentor || !isGenerating || currentPage !== 2) return;
    if (generatingNodeIds.has(node.node_id)) return;
    const nodeId = node.node_id;
    let cancelled = false;
    studyMaterialService
      .getActiveVersion(nodeId)
      .then((version) => {
        if (cancelled) return;
        if (version) {
          patchNodeStudyState(nodeId, {
            isGenerating: false,
            generationProgressSessionId: null,
            studyMaterialContent: version.content,
            activeVersion: version,
            hasTriggeredGeneration: true,
          });
          return;
        }
        patchNodeStudyState(nodeId, {
          isGenerating: false,
          generationProgressSessionId: null,
          currentPage: 1,
          hasTriggeredGeneration: false,
        });
      })
      .catch(() => {/* non-critical */ });
    return () => {
      cancelled = true;
    };
  }, [node?.node_id, isMentor, isGenerating, currentPage, patchNodeStudyState]);

  // Load version history on page 2 (once per node/page — not on every activeVersion change)
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    void refreshVersionHistoryRef.current(node.node_id);
  }, [node?.node_id, currentPage, isMentor]);

  // When every draft is in the archive, load one for viewing so Material is not blank.
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2 || isGenerating) return;
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
  ]);

  // Load the best available version when Material opens with history but no body.
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2 || isGenerating || isLoadingVersions) return;
    if (studyMaterialContent?.trim()) return;
    if (versionHistory.length === 0 && archivedVersionHistory.length === 0) return;

    const workspaceVersions = versionHistory.filter(
      (v) => !v.is_archived && v.mentor_display_badge !== "Previous for students"
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

    const isWorkspaceDraft =
      !targetSummary.is_archived &&
      !targetSummary.is_published &&
      targetSummary.mentor_display_badge !== "Previous for students";

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
      if (!cancelled && isWorkspaceDraft && !targetSummary.is_active) {
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
    if (!node) return;
    const nodeId = node.node_id;
    await refreshVersionHistory(nodeId);
    const activeFromServer = await studyMaterialService.getActiveVersion(nodeId);
    patchNodeStudyState(nodeId, {
      activeVersion: activeFromServer,
      ...(viewingVersionId === version.version_id
        ? { studyMaterialContent: version.content }
        : {}),
    });
    await refreshMentorUiStateRef.current(nodeId, viewingVersionId);
    onMentorProgressRefreshRef.current?.();
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
      await finalizeVersionMutation(version);
      const nodeId = node.node_id;
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

  const handleGenerateStudyMaterial = async () => {
    if (!node || isGenerating) return;
    const nodeId = node.node_id;
    const progressSessionId = createGenerationProgressSessionId();
    generatingNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, {
      hasTriggeredGeneration: true,
      currentPage: 2,
      isGenerating: true,
      generationProgressSessionId: progressSessionId,
    });
    setProcessingLabel("Generating study material");
    try {
      const version = await studyMaterialService.generate(nodeId, {
        reference_material_id: referenceMaterial?.material_id ?? null,
        progress_session_id: progressSessionId,
      });
      applyVersion(nodeId, version);
      if (isViewingNode(nodeId)) {
        await refreshVersionHistory(nodeId);
        await refreshMentorUiStateRef.current(nodeId, null);
      }
      patchNodeStudyState(nodeId, {
        isGenerating: false,
        generationProgressSessionId: null,
      });
      toast.success(`Study material saved as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      patchNodeStudyState(nodeId, {
        currentPage: 1,
        hasTriggeredGeneration: false,
        isGenerating: false,
        generationProgressSessionId: null,
      });
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
    generatingNodeIds.add(nodeId);
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
    const progressSessionId = createGenerationProgressSessionId();
    patchNodeStudyState(nodeId, {
      hasTriggeredGeneration: true,
      currentPage: 2,
      isGenerating: true,
      studyMaterialContent: null,
      activeVersion: null,
      generationProgressSessionId: progressSessionId,
    });
    setProcessingLabel("Generating study material");
    try {
      await studyMaterialService.clearAllDrafts(nodeId);
      const version = await studyMaterialService.generate(nodeId, {
        reference_material_id: referenceMaterial?.material_id ?? null,
        progress_session_id: progressSessionId,
      });
      applyVersion(nodeId, version);
      if (isViewingNode(nodeId)) {
        await refreshVersionHistory(nodeId);
        // Refresh mentor UI state so publish/unpublish flags reflect the freshly
        // generated (never-published) version. Without this the stale state from
        // the deleted versions bleeds through and shows a phantom "Unpublish"
        // button on the new version, which then 409s when clicked.
        await refreshMentorUiStateRef.current(nodeId, null);
      }
      patchNodeStudyState(nodeId, {
        isGenerating: false,
        generationProgressSessionId: null,
      });
      toast.success(`Study material regenerated as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      // If clearAllDrafts succeeded but generate failed, all drafts are gone.
      // Reset hasTriggeredGeneration so the UI returns to the "no material" state
      // rather than showing a broken empty page 2.
      patchNodeStudyState(nodeId, {
        currentPage: 1,
        isGenerating: false,
        generationProgressSessionId: null,
        hasTriggeredGeneration: false,
        studyMaterialContent: null,
        activeVersion: null,
      });
      if (isViewingNode(nodeId)) {
        await refreshClearDraftsEligibility(nodeId);
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
    const progressSessionId = createGenerationProgressSessionId();
    generatingNodeIds.add(nodeId);
    patchNodeStudyState(nodeId, {
      isGenerating: true,
      currentPage: 2,
      generationProgressSessionId: progressSessionId,
    });
    // Close the modal immediately so the user sees the full progress panel on page 2
    if (isViewingNode(nodeId)) {
      setFeedbackModalMode(null);
    }
    setProcessingLabel(mode === "regenerate" ? "Regenerating study material" : "Improving study material");
    try {
      const res =
        mode === "regenerate"
          ? await studyMaterialService.regenerate(nodeId, {
            mentor_regeneration_goal: feedback,
            progress_session_id: progressSessionId,
          })
          : await studyMaterialService.improve(nodeId, {
            mentor_feedback: feedback,
            progress_session_id: progressSessionId,
          });
      
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
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      patchNodeStudyState(nodeId, {
        isGenerating: false,
        generationProgressSessionId: null,
      });
      generatingNodeIds.delete(nodeId);
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
    const isWorkspaceDraft =
      !summary?.is_archived &&
      !summary?.is_published &&
      summary?.mentor_display_badge !== "Previous for students";

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
    } catch (err) {
      toast.error(extractErrorDetail(err));
    }

    // Silently activate workspace drafts so Regenerate/Improve/Edit are never blocked.
    if (isWorkspaceDraft && !summary?.is_active) {
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

  const handleReturnToActiveDraft = async () => {
    if (!node || !activeVersion) return;
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
      const wasActive = activeVersion?.version_id === versionId;
      await refreshVersionHistory(nodeId);
      if (wasActive) {
        const nextActive = await studyMaterialService.getActiveVersion(nodeId);
        if (nextActive) {
          patchNodeStudyState(nodeId, {
            activeVersion: nextActive,
            studyMaterialContent: nextActive.content,
          });
          setViewingVersionId(null);
          setShowArchivedPanel(false);
        } else {
          setShowArchivedPanel(true);
          setViewingVersionId(versionId);
          try {
            const archivedVersion = await studyMaterialService.getVersion(nodeId, versionId);
            patchNodeStudyState(nodeId, {
              activeVersion: null,
              studyMaterialContent: archivedVersion.content,
            });
          } catch {
            patchNodeStudyState(nodeId, {
              activeVersion: null,
              studyMaterialContent: null,
            });
          }
        }
      } else if (viewingVersionId === versionId) {
        setShowArchivedPanel(true);
        patchNodeStudyState(nodeId, { studyMaterialContent: null });
      }
      await refreshMentorUiStateRef.current(nodeId, wasActive ? versionId : viewingVersionId);
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

  const versionActions = mentorUiState?.displayed_version_actions;

  const canAccessStudyMaterial = mentorUiState?.can_access_study_material ?? false;
  const hasWorkspaceStudyMaterial = Boolean(mentorUiState?.has_workspace_versions);
  const canAccessQuiz = mentorUiState?.can_access_quiz ?? false;
  const displayedVersionId = viewingVersionId ?? activeVersion?.version_id ?? null;
  const displayedVersionSummary = findVersionSummary(displayedVersionId);
  const isViewingArchivedVersion = versionActions?.is_viewing_archived ?? false;
  const isViewingNonActiveVersion = versionActions?.is_viewing_non_active ?? false;
  const canEditActiveDraft = versionActions?.can_edit_active_draft ?? false;
  const canArchiveDisplayedVersion = versionActions?.can_archive ?? false;
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

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    // Accessors
    currentPage,
    hasTriggeredGeneration,
    studyMaterialContent,
    activeVersion,
    isGenerating,
    generationProgressSessionId,
    referenceMaterial,
    nodeMedia,
    isLoadingGenerationSource,
    isLoadingTopicResources,
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
    handleRegenerateStudyMaterialFresh,
    runFeedbackAction,
    handleManualEditSave,
    handleSelectVersion,
    handleActivateVersion,
    handleReturnToActiveDraft,
    handleArchiveCurrentVersion,
    handleUnarchiveCurrentVersion,
    handleUnarchiveVersion,
    handleClearAllDrafts,
    handlePublishCurrentVersion,
    handleUnpublishCurrentVersion,
    handleKeepExistingDraftsAfterMove,
    handleUseNewInstructions,
    setReferenceMaterial,
    setReferenceMaterialForNode,
    refreshGenerationSource,
    refreshTopicResources,
  };
}
