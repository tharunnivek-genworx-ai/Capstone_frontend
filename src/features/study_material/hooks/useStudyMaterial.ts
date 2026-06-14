import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { TopicContentPage } from "../../spaces/types/node.types";
import type {
  ReferenceMaterialOut,
  StudyMaterialClearDraftsEligibilityOut,
  StudyMaterialFeedbackMode,
  StudyMaterialMentorUiStateOut,
  StudyMaterialVersionOut,
  StudyMaterialVersionSummary,
  NodeStudyStatePatch,
  NodeStudyState,
} from "../types/studyMaterial.types";
import { studyMaterialService } from "../services/studyMaterialService";
import { referenceMaterialService } from "../services/referenceMaterialService";

// Re-export for consumers that import from this hook
export type { NodeStudyStatePatch, NodeStudyState };

interface UseStudyMaterialParams {
  node: NodeTreeNode | null;
  spaceId: string;
  isMentor: boolean;
  studyState?: NodeStudyState;
  onStudyStateChange?: (patch: NodeStudyStatePatch) => void;
}

export interface UseStudyMaterialReturn {
  // ── Convenient accessors (derived from props) ──────────────────────────
  currentPage: TopicContentPage;
  hasTriggeredGeneration: boolean;
  studyMaterialContent: string | null;
  activeVersion: StudyMaterialVersionOut | null;
  isGenerating: boolean;
  referenceMaterial: ReferenceMaterialOut | null;
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
  isDeletingDrafts: boolean;
  clearDraftsEligibility: StudyMaterialClearDraftsEligibilityOut | null;

  // ── Computed ──────────────────────────────────────────────────────────
  canAccessStudyMaterial: boolean;
  canAccessQuiz: boolean;
  displayedVersionId: string | null;
  displayedVersionSummary: StudyMaterialVersionSummary | null;
  isViewingArchivedVersion: boolean;
  isViewingNonActiveVersion: boolean;
  canEditActiveDraft: boolean;
  canArchiveDisplayedVersion: boolean;
  canPublishDisplayedVersion: boolean;
  canUnpublishDisplayedVersion: boolean;
  canClearAllDrafts: boolean;
  clearDraftsBlockReason: string | undefined;
  showInstructionChangeBanner: boolean;
  mentorUiState: StudyMaterialMentorUiStateOut | null;

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
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useStudyMaterial({
  node,
  spaceId,
  isMentor,
  studyState,
  onStudyStateChange,
}: UseStudyMaterialParams): UseStudyMaterialReturn {
  // ── Local state ───────────────────────────────────────────────────────────
  const [feedbackModalMode, setFeedbackModalMode] = useState<StudyMaterialFeedbackMode | null>(null);
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [versionHistory, setVersionHistory] = useState<StudyMaterialVersionSummary[]>([]);
  const [archivedVersionHistory, setArchivedVersionHistory] = useState<StudyMaterialVersionSummary[]>([]);
  const [showArchivedPanel, setShowArchivedPanel] = useState(false);
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
  const [isDeletingDrafts, setIsDeletingDrafts] = useState(false);
  const [showRefModal, setShowRefModal] = useState(false);

  const onStudyStateChangeRef = useRef(onStudyStateChange);
  onStudyStateChangeRef.current = onStudyStateChange;
  const refreshVersionHistoryRef = useRef<(nodeId: string) => Promise<void>>(async () => {});
  const refreshMentorUiStateRef = useRef<(nodeId: string, viewingId?: string | null) => Promise<void>>(
    async () => {}
  );
  const versionHistoryRequestRef = useRef(0);

  // ── Convenient accessors into lifted state ────────────────────────────────
  const currentPage = studyState?.currentPage ?? 1;
  const hasTriggeredGeneration = studyState?.hasTriggeredGeneration ?? false;
  const studyMaterialContent = studyState?.studyMaterialContent ?? null;
  const activeVersion = studyState?.activeVersion ?? null;
  const isGenerating = studyState?.isGenerating ?? false;
  const referenceMaterial = studyState?.referenceMaterial ?? null;
  const currentEffectiveInstruction = node?.effective_instruction ?? "";

  const setCurrentPage = (p: TopicContentPage) => onStudyStateChangeRef.current?.({ currentPage: p });
  const setIsGenerating = (v: boolean) => onStudyStateChangeRef.current?.({ isGenerating: v });
  const setReferenceMaterial = (m: ReferenceMaterialOut | null) =>
    onStudyStateChangeRef.current?.({ referenceMaterial: m });

  const applyVersion = (version: StudyMaterialVersionOut, clearViewing = true) => {
    if (clearViewing) setViewingVersionId(null);
    onStudyStateChangeRef.current?.({
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
          onStudyStateChangeRef.current?.({ hasTriggeredGeneration: true });
        }
      } catch {
        setMentorUiState(null);
      }
    },
    [viewingVersionId]
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
    setIsLoadingVersions(false);
    setFeedbackModalMode(null);
    setIsManualEditMode(false);
    setViewingVersionId(null);
    setVersionHistory([]);
    setArchivedVersionHistory([]);
    setShowArchivedPanel(false);
    setClearDraftsEligibility(null);
    setShowDeleteDraftModal(false);
    setShowRegenerateConfirmModal(false);
    // Clear stale mentor UI state so the old node's instruction-change banner
    // never bleeds into the newly selected node before the fresh fetch arrives.
    setMentorUiState(null);
  }, [node?.node_id]);

  // Load existing reference material when switching to a new node
  useEffect(() => {
    if (!node || !isMentor) return;
    if (studyState?.referenceMaterial !== undefined) return;
    referenceMaterialService.getLatestByNode(node.node_id).then((latest) => {
      onStudyStateChangeRef.current?.({ referenceMaterial: latest });
    }).catch(() => {/* non-critical */ });
  }, [node?.node_id]);

  // Enable study-material navigation when versions already exist on the server
  useEffect(() => {
    if (!node || !isMentor || hasTriggeredGeneration) return;
    let cancelled = false;
    Promise.all([
      studyMaterialService.listVersions(node.node_id, { archived: false }),
      studyMaterialService.listVersions(node.node_id, { archived: true }),
    ])
      .then(([history, archived]) => {
        if (cancelled || (history.versions.length === 0 && archived.versions.length === 0)) return;
        onStudyStateChangeRef.current?.({ hasTriggeredGeneration: true });
      })
      .catch(() => {/* non-critical */ });
    return () => {
      cancelled = true;
    };
  }, [node?.node_id, isMentor, hasTriggeredGeneration]);

  // Re-fetch mentor UI state whenever the node changes, when viewingVersionId
  // changes, OR when the effective instruction changes (e.g. after reparenting
  // the node in the tree, or after saving updated teaching settings).
  // Without currentEffectiveInstruction in deps, a node move would never
  // trigger a re-fetch, so instruction_changed_since_generation would stay
  // stale (false) and the instruction-change banner would never appear.
  useEffect(() => {
    if (!node || !isMentor) return;
    void refreshMentorUiStateRef.current(node.node_id, viewingVersionId);
  }, [node?.node_id, isMentor, viewingVersionId, currentEffectiveInstruction]);

  // Load active study material version when opening page 2 without cached content
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    if (studyMaterialContent || isGenerating) return;
    studyMaterialService
      .getActiveVersion(node.node_id)
      .then((version) => {
        if (version) {
          onStudyStateChangeRef.current?.({
            studyMaterialContent: version.content,
            activeVersion: version,
            hasTriggeredGeneration: true,
          });
        }
      })
      .catch(() => {/* non-critical */ });
  }, [node?.node_id, currentPage, studyMaterialContent, isGenerating, isMentor]);

  // Load version history on page 2 (once per node/page — not on every activeVersion change)
  useEffect(() => {
    if (!node || !isMentor || currentPage !== 2) return;
    void refreshVersionHistoryRef.current(node.node_id);
  }, [node?.node_id, currentPage, isMentor]);

  // Load delete/regenerate eligibility whenever material exists
  useEffect(() => {
    if (!node || !isMentor || !hasTriggeredGeneration) return;
    void refreshClearDraftsEligibility(node.node_id);
  }, [node?.node_id, hasTriggeredGeneration, isMentor, refreshClearDraftsEligibility]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const extractErrorDetail = (err: unknown): string => {
    const e = err as { response?: { data?: string | { detail?: string } }; message?: string };
    if (typeof e?.response?.data === "string") return e.response.data;
    return e?.response?.data?.detail ?? e?.message ?? "Request failed.";
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerateStudyMaterial = async () => {
    if (!node || isGenerating) return;
    onStudyStateChangeRef.current?.({
      hasTriggeredGeneration: true,
      currentPage: 2,
      isGenerating: true,
    });
    setProcessingLabel("Generating study material");
    try {
      const version = await studyMaterialService.generate(node.node_id, {
        reference_material_id: referenceMaterial?.material_id ?? null,
      });
      applyVersion(version);
      await refreshVersionHistory(node.node_id);
      onStudyStateChangeRef.current?.({ isGenerating: false });
      toast.success(`Study material saved as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      onStudyStateChangeRef.current?.({
        currentPage: 1,
        hasTriggeredGeneration: false,
        isGenerating: false,
      });
    } finally {
      setProcessingLabel(null);
    }
  };

  const handleRegenerateStudyMaterialFresh = async () => {
    if (!node || isGenerating || isDeletingDrafts) return;
    setIsDeletingDrafts(true);
    setShowRegenerateConfirmModal(false);
    setFeedbackModalMode(null);
    setIsManualEditMode(false);
    setViewingVersionId(null);
    setVersionHistory([]);
    setArchivedVersionHistory([]);
    setShowArchivedPanel(false);
    setInstructionBannerDismissedByNode((dismissed) => {
      if (!(node.node_id in dismissed)) return dismissed;
      const next = { ...dismissed };
      delete next[node.node_id];
      return next;
    });
    onStudyStateChangeRef.current?.({
      hasTriggeredGeneration: true,
      currentPage: 2,
      isGenerating: true,
      studyMaterialContent: null,
      activeVersion: null,
    });
    setProcessingLabel("Generating study material");
    try {
      await studyMaterialService.clearAllDrafts(node.node_id);
      const version = await studyMaterialService.generate(node.node_id, {
        reference_material_id: referenceMaterial?.material_id ?? null,
      });
      applyVersion(version);
      await refreshVersionHistory(node.node_id);
      // Refresh mentor UI state so publish/unpublish flags reflect the freshly
      // generated (never-published) version. Without this the stale state from
      // the deleted versions bleeds through and shows a phantom "Unpublish"
      // button on the new version, which then 409s when clicked.
      await refreshMentorUiStateRef.current(node.node_id, null);
      onStudyStateChangeRef.current?.({ isGenerating: false });
      toast.success(`Study material regenerated as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
      // If clearAllDrafts succeeded but generate failed, all drafts are gone.
      // Reset hasTriggeredGeneration so the UI returns to the "no material" state
      // rather than showing a broken empty page 2.
      onStudyStateChangeRef.current?.({
        currentPage: 1,
        isGenerating: false,
        hasTriggeredGeneration: false,
        studyMaterialContent: null,
        activeVersion: null,
      });
      await refreshClearDraftsEligibility(node.node_id);
    } finally {
      setIsDeletingDrafts(false);
      setProcessingLabel(null);
    }
  };

  const runFeedbackAction = async (mode: StudyMaterialFeedbackMode, feedback: string) => {
    if (!node || isGenerating) return;
    setIsGenerating(true);
    setProcessingLabel(mode === "regenerate" ? "Regenerating study material" : "Improving study material");
    try {
      const version =
        mode === "regenerate"
          ? await studyMaterialService.regenerate(node.node_id, {
            mentor_regeneration_goal: feedback,
          })
          : await studyMaterialService.improve(node.node_id, {
            mentor_feedback: feedback,
          });
      applyVersion(version);
      await refreshVersionHistory(node.node_id);
      setFeedbackModalMode(null);
      toast.success(`Saved as ${version.display_label}.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsGenerating(false);
      setProcessingLabel(null);
    }
  };

  const handleManualEditSave = async (content: string) => {
    if (!node || isSavingManualEdit) return;
    setIsSavingManualEdit(true);
    try {
      const version = await studyMaterialService.manualEdit(node.node_id, { content });
      applyVersion(version);
      await refreshVersionHistory(node.node_id);
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
    const summary = findVersionSummary(versionId);
    if (summary?.is_archived) {
      setShowArchivedPanel(true);
    }
    setViewingVersionId(versionId);
    try {
      const version = await studyMaterialService.getVersion(node.node_id, versionId);
      onStudyStateChangeRef.current?.({ studyMaterialContent: version.content });
    } catch (err) {
      toast.error(extractErrorDetail(err));
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (!node || isActivatingVersion) return;
    setIsActivatingVersion(true);
    try {
      const version = await studyMaterialService.activate(node.node_id, {
        version_id: versionId,
      });
      applyVersion(version, true);
      await refreshVersionHistory(node.node_id);
      await refreshMentorUiStateRef.current(node.node_id, null);
      toast.success(`${version.display_label} is now your working draft.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsActivatingVersion(false);
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    if (!node || isPublishingVersion) return;
    setIsPublishingVersion(true);
    try {
      const version = await studyMaterialService.publish(node.node_id, {
        version_id: versionId,
      });
      applyVersion(version, false);
      await refreshVersionHistory(node.node_id);
      // Refresh mentor UI state so can_publish / can_unpublish update immediately
      // without requiring a page reload.
      await refreshMentorUiStateRef.current(node.node_id, viewingVersionId);
      toast.success(`${version.display_label} published for trainees.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsPublishingVersion(false);
    }
  };

  const handleUnpublishVersion = async (versionId: string) => {
    if (!node || isUnpublishingVersion) return;
    setIsUnpublishingVersion(true);
    try {
      const version = await studyMaterialService.unpublish(node.node_id, {
        version_id: versionId,
      });
      applyVersion(version, false);
      await refreshVersionHistory(node.node_id);
      // Refresh mentor UI state so the button flips to "Publish" immediately.
      await refreshMentorUiStateRef.current(node.node_id, viewingVersionId);
      toast.success(`${version.display_label} unpublished.`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsUnpublishingVersion(false);
    }
  };

  const handleReturnToActiveDraft = async () => {
    if (!node || !activeVersion) return;
    setViewingVersionId(null);
    setShowArchivedPanel(false);
    onStudyStateChangeRef.current?.({ studyMaterialContent: activeVersion.content });
  };

  const handleArchiveVersion = async (versionId: string) => {
    if (!node || isArchivingVersion) return;
    setIsArchivingVersion(true);
    try {
      await studyMaterialService.archive(node.node_id, versionId);
      const wasActive = activeVersion?.version_id === versionId;
      const wasViewing = viewingVersionId === versionId;
      await refreshVersionHistory(node.node_id);
      if (wasActive) {
        const nextActive = await studyMaterialService.getActiveVersion(node.node_id);
        if (nextActive) {
          onStudyStateChangeRef.current?.({
            activeVersion: nextActive,
            studyMaterialContent: nextActive.content,
          });
          setViewingVersionId(null);
        } else {
          onStudyStateChangeRef.current?.({ activeVersion: null });
          if (wasViewing) {
            setShowArchivedPanel(true);
          }
        }
      } else if (wasViewing) {
        setShowArchivedPanel(true);
      }
      await refreshMentorUiStateRef.current(node.node_id, wasActive ? null : viewingVersionId);
      toast.success("Version archived.");
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsArchivingVersion(false);
    }
  };

  const handleUnarchiveVersion = async (versionId: string) => {
    if (!node || isUnarchivingVersion) return;
    setIsUnarchivingVersion(true);
    try {
      await studyMaterialService.unarchive(node.node_id, versionId);
      await refreshVersionHistory(node.node_id);
      setShowArchivedPanel(false);
      await refreshMentorUiStateRef.current(node.node_id, null);
      toast.success("Version restored to history.");
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
      onStudyStateChangeRef.current?.({
        currentPage: 1,
        hasTriggeredGeneration: false,
        studyMaterialContent: null,
        activeVersion: null,
      });
      toast.success(
        result.deleted_count === 1
          ? "Draft deleted. You can generate fresh study material from the teaching page."
          : `${result.deleted_count} drafts deleted. You can generate fresh study material from the teaching page.`
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

  // ── Computed values ───────────────────────────────────────────────────────

  const versionActions = mentorUiState?.displayed_version_actions;

  const canAccessStudyMaterial = mentorUiState?.can_access_study_material ?? hasTriggeredGeneration;
  const canAccessQuiz =
    (mentorUiState?.can_access_quiz ?? false) && !isGenerating && Boolean(studyMaterialContent);
  const displayedVersionId = viewingVersionId ?? activeVersion?.version_id ?? null;
  const displayedVersionSummary = findVersionSummary(displayedVersionId);
  const isViewingArchivedVersion = versionActions?.is_viewing_archived ?? Boolean(displayedVersionSummary?.is_archived);
  const isViewingNonActiveVersion = versionActions?.is_viewing_non_active ?? Boolean(
    viewingVersionId && viewingVersionId !== activeVersion?.version_id
  );
  const canEditActiveDraft = versionActions?.can_edit_active_draft ?? (
    Boolean(activeVersion?.is_active) &&
    !isViewingNonActiveVersion &&
    !isViewingArchivedVersion
  );
  const canArchiveDisplayedVersion = versionActions?.can_archive ?? Boolean(
    displayedVersionId &&
    displayedVersionSummary &&
    !displayedVersionSummary.is_published &&
    !displayedVersionSummary.is_archived
  );
  const canPublishDisplayedVersion = versionActions?.can_publish ?? Boolean(
    displayedVersionId &&
    displayedVersionSummary &&
    !displayedVersionSummary.is_published &&
    !displayedVersionSummary.is_archived &&
    !isViewingArchivedVersion
  );
  const canUnpublishDisplayedVersion = versionActions?.can_unpublish ?? Boolean(
    displayedVersionId &&
    displayedVersionSummary?.is_published &&
    !isViewingArchivedVersion
  );
  const canClearAllDrafts = Boolean(clearDraftsEligibility?.can_clear);
  const clearDraftsBlockReason = clearDraftsEligibility?.block_reason ?? undefined;
  const instructionBannerDismissedFor = node
    ? instructionBannerDismissedByNode[node.node_id]
    : undefined;
  const showInstructionChangeBanner = Boolean(
    mentorUiState?.instruction_changed_since_generation &&
    mentorUiState.current_effective_instruction !== instructionBannerDismissedFor
  );

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    // Accessors
    currentPage,
    hasTriggeredGeneration,
    studyMaterialContent,
    activeVersion,
    isGenerating,
    referenceMaterial,
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
    isDeletingDrafts,
    clearDraftsEligibility,

    // Computed
    canAccessStudyMaterial,
    canAccessQuiz,
    displayedVersionId,
    displayedVersionSummary,
    isViewingArchivedVersion,
    isViewingNonActiveVersion,
    canEditActiveDraft,
    canArchiveDisplayedVersion,
    canPublishDisplayedVersion,
    canUnpublishDisplayedVersion,
    canClearAllDrafts,
    clearDraftsBlockReason,
    showInstructionChangeBanner,
    mentorUiState,

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
  };
}
