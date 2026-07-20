// src/features/spaces/components/SpaceDetailPage.tsx
/**
 * Space detail page: two-panel layout with topic tree + node detail.
 * Header shows space name, department, invite code copy, and publish toggle.
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { spaceService } from "../services/spaceService";
import { useTopicTree } from "../hooks/useTopicTree";
import type { SpaceResponse, SpaceUnpublishPreviewOut, RepublishChecklistNode } from "../types/space.types";
import type { NodeTreeNode, NodeUpdateInstructionRequest, NodeArchiveRequest } from "../types/node.types";
import type { NodeStudyState, NodeStudyStatePatch } from "../../study_material/types/studyMaterial.types";
import type { TopicContentPage } from "../types/node.types";
import TopicTree from "./TopicTree";
import NodeDetailPanel from "./NodeDetailPanel";
import TraineeTopicTree from "../../trainee_study_material/components/TraineeTopicTree";
import TraineeNodeDetailPanel from "../../trainee_study_material/components/TraineeNodeDetailPanel";
import {
  TRAINEE_NODES_UNLOCKED_EVENT,
  type TraineeNodesUnlockedDetail,
} from "../../trainee_study_material/utils/unlockEvents";
import InviteCodeModal from "./InviteCodeModal";
import ManageTraineesModal from "./ManageTraineesModal";
import { useAuth } from "../../auth/hooks/useAuth";
import { studyMaterialService } from "../../study_material/services/studyMaterialService";
import EspaceUnpublishConfirmModal from "./EspaceUnpublishConfirmModal";
import EspaceRepublishChecklistModal from "./EspaceRepublishChecklistModal";
import { useTraineeSpaceProgress } from "../../trainee_space_progress/hooks/useTraineeSpaceProgress";
import SpaceProgressPanel from "../../trainee_space_progress/components/SpaceProgressPanel";
import { useMentorSpaceProgress, MentorSpaceProgressPanel, mentorProgressService } from "../../mentor_progress_view";
import GenerateAllRootPickerModal from "../../study_material/components/queue/GenerateAllRootPickerModal";
import GenerateAllPolicyModal from "../../study_material/components/queue/GenerateAllPolicyModal";
import GenerateAllInstructionWarningModal from "../../study_material/components/queue/GenerateAllInstructionWarningModal";
import BatchProgressPanel from "../../study_material/components/queue/BatchProgressPanel";
import { studyMaterialBatchService } from "../../study_material/services/studyMaterialBatchService";
import { useBatchJobPoll } from "../../study_material/hooks/useBatchJobPoll";
import type {
  BatchStepStatus,
  ExistingMaterialPolicy,
  StudyMaterialBatchPreviewResponse,
} from "../../study_material/types/studyMaterialBatch.types";
import {
  clearBatchHubSession,
  readBatchHubSession,
  writeBatchHubSession,
} from "../../study_material/utils/batchHubSession";
import {
  findBatchStepForNode,
  isBatchHubEligibleNode,
} from "../../study_material/utils/batchHubEligibility";

function findNodeInTree(nodes: NodeTreeNode[], id: string): NodeTreeNode | null {
  for (const n of nodes) {
    if (n.node_id === id) return n;
    const found = findNodeInTree(n.children, id);
    if (found) return found;
  }
  return null;
}

const SpaceDetailPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();
  const isMentor = role === "mentor";

  const [space, setSpace] = useState<SpaceResponse | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeTreeNode | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showManageTrainees, setShowManageTrainees] = useState(false);
  const [unpublishPreview, setUnpublishPreview] = useState<SpaceUnpublishPreviewOut | null>(null);
  const [isLoadingUnpublishPreview, setIsLoadingUnpublishPreview] = useState(false);
  const [republishChecklist, setRepublishChecklist] = useState<RepublishChecklistNode[] | null>(null);
  const [nodeContentRefreshTokens, setNodeContentRefreshTokens] = useState<Record<string, number>>({});
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [treePanelWidth, setTreePanelWidth] = useState(280);
  const [isTopicPanelVisible, setIsTopicPanelVisible] = useState(true);
  const [nodeStudyStates, setNodeStudyStates] = useState<Map<string, NodeStudyState>>(new Map());
  const [showSpaceProgress, setShowSpaceProgress] = useState(false);
  const [cameFromSpaceProgress, setCameFromSpaceProgress] = useState(false);
  const [showRootPickerModal, setShowRootPickerModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedBatchNodeIds, setSelectedBatchNodeIds] = useState<string[]>([]);
  const [selectedBatchExternalResearchNodeIds, setSelectedBatchExternalResearchNodeIds] =
    useState<string[]>([]);
  /** Space-scoped mentor prefs: which topics should use external research. */
  const [externalResearchByNodeId, setExternalResearchByNodeId] = useState<
    Record<string, boolean>
  >({});
  const [batchPreview, setBatchPreview] = useState<StudyMaterialBatchPreviewResponse | null>(null);
  const [existingPolicy, setExistingPolicy] = useState<ExistingMaterialPolicy>("skip");
  const [isSubmittingBatchFlow, setIsSubmittingBatchFlow] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [showBatchProgressPanel, setShowBatchProgressPanel] = useState(false);
  /** Cohort context for Batch Parent Hub (session-restored or live generate-all). */
  const [batchHubEnabled, setBatchHubEnabled] = useState(false);
  const completedBatchStepIdsRef = useRef<Set<string>>(new Set());
  const settledBatchStepIdsRef = useRef<Set<string>>(new Set());
  const batchAutoOpenedMaterialNodeIdsRef = useRef<Set<string>>(new Set());
  /** Mentor dismissed hub navigation for this space visit — do not re-enable from poll. */
  const batchHubDismissedRef = useRef(false);
  const {
    batchDetail,
    steps: batchSteps,
    currentRunningStep,
    isPolling: isBatchPolling,
    error: batchPollingError,
    cancel: cancelBatchJob,
  } = useBatchJobPoll(activeBatchId, spaceId ?? null);

  const batchStepStatusByNodeId = useMemo(() => {
    const map: Record<string, BatchStepStatus> = {};
    for (const step of batchSteps) {
      map[step.node_id] = step.status;
    }
    return map;
  }, [batchSteps]);

  const busyNodeIds = useMemo(() => {
    if (!batchDetail || !["pending", "running"].includes(batchDetail.batch.status)) {
      return new Set<string>();
    }
    return new Set(
      batchDetail.steps
        .filter((step) => step.status === "pending" || step.status === "running")
        .map((step) => step.node_id),
    );
  }, [batchDetail]);

  /** Hub/cohort context for this space only (ignore stale detail while switching spaces). */
  const spaceBatchDetail = useMemo(() => {
    if (!spaceId || !batchDetail || batchDetail.batch.space_id !== spaceId) return null;
    return batchDetail;
  }, [spaceId, batchDetail]);

  // Resume in-flight batch after reload / space switch.
  // Terminal session restore keeps batchDetail for hub only — do not open the progress panel.
  useEffect(() => {
    if (!batchDetail) return;
    const { batch_id: batchId, status } = batchDetail.batch;
    if (status === "pending" || status === "running") {
      setActiveBatchId((prev) => (prev === batchId ? prev : batchId));
      setShowBatchProgressPanel(true);
    }
  }, [batchDetail]);

  // Persist cohort while hub context is active (refreshes TTL; skipped after dismiss).
  useEffect(() => {
    if (!spaceId || !isMentor || !spaceBatchDetail || !batchHubEnabled) return;
    writeBatchHubSession(spaceId, spaceBatchDetail.batch.batch_id);
  }, [spaceId, isMentor, spaceBatchDetail, batchHubEnabled]);

  // Restore hub cohort: active batch first, else sessionStorage terminal batch via getBatch.
  useEffect(() => {
    if (!spaceId || !isMentor) return;
    let cancelled = false;

    const restoreBatchHubCohort = async () => {
      try {
        const active = await studyMaterialBatchService.getActiveBatch(spaceId);
        if (cancelled) return;
        if (active) {
          if (!batchHubDismissedRef.current) {
            writeBatchHubSession(spaceId, active.batch.batch_id);
            setBatchHubEnabled(true);
          }
          return;
        }

        const sessionBatchId = readBatchHubSession(spaceId);
        if (!sessionBatchId || cancelled || batchHubDismissedRef.current) return;
        setActiveBatchId(sessionBatchId);
        setBatchHubEnabled(true);
      } catch {
        if (cancelled || batchHubDismissedRef.current) return;
        const sessionBatchId = readBatchHubSession(spaceId);
        if (sessionBatchId) {
          setActiveBatchId(sessionBatchId);
          setBatchHubEnabled(true);
        }
      }
    };

    void restoreBatchHubCohort();
    return () => {
      cancelled = true;
    };
  }, [spaceId, isMentor]);

  const handleDismissBatchHub = useCallback(() => {
    if (!spaceId) return;
    batchHubDismissedRef.current = true;
    clearBatchHubSession(spaceId);
    setBatchHubEnabled(false);
    const status = spaceBatchDetail?.batch.status;
    if (status !== "pending" && status !== "running") {
      setActiveBatchId(null);
    }
  }, [spaceId, spaceBatchDetail?.batch.status]);

  const {
    progress: traineeSpaceProgress,
    isLoading: isLoadingTraineeSpaceProgress,
    error: traineeSpaceProgressError,
    refresh: refreshTraineeSpaceProgress,
  } = useTraineeSpaceProgress(!isMentor && spaceId ? spaceId : null);

  const {
    progress: mentorSpaceProgress,
    isLoading: isLoadingMentorSpaceProgress,
    error: mentorSpaceProgressError,
    refresh: refreshMentorSpaceProgress,
  } = useMentorSpaceProgress(isMentor && spaceId ? spaceId : null);

  // Return undefined for nodes never visited so useStudyMaterial can distinguish
  // "not yet loaded" (undefined) from "loaded, no material" (null) when deciding
  // whether to fetch reference material from the server.
  const getNodeStudyState = useCallback((nodeId: string): NodeStudyState | undefined => {
    return nodeStudyStates.get(nodeId);
  }, [nodeStudyStates]);

  const updateNodeStudyState = useCallback(
    (nodeId: string, patch: Partial<NodeStudyState>) => {
      setNodeStudyStates((prev) => {
        const existing = prev.get(nodeId) ?? {
          currentPage: 1 as TopicContentPage,
          hasTriggeredGeneration: false,
          studyMaterialContent: null,
          activeVersion: null,
          isGenerating: false,
          isGeneratingQuiz: false,
          isGeneratingHints: false,
          generationProgressSessionId: null,
          activeGenerationRunId: null,
          generationRunFailed: false,
          generationRunPaused: false,
          failedGenerationPipeline: null,
          isPausingGeneration: false,
          isAbandoningGeneration: false,
          referenceMaterial: null,
          currentQuizId: null,
          generationProgress: null,
        };
        const next = new Map(prev);
        next.set(nodeId, { ...existing, ...patch });
        return next;
      });
    },
    []
  );


  const handleStudyStateChange = useCallback(
    (nodeId: string, patch: NodeStudyStatePatch) => {
      updateNodeStudyState(nodeId, patch);
    },
    [updateNodeStudyState]
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const {
    roots,
    isLoading: isLoadingTree,
    error: treeError,
    fetchTree,
    createNode,
    renameNode,
    updateNodeInstruction,
    reparentNode,
    reorderNode,
    archiveNode,
    clearError: clearTreeError,
  } = useTopicTree();

  const handleArchiveNode = useCallback(
    async (nodeId: string, payload: NodeArchiveRequest) => {
      const result = await archiveNode(nodeId, payload);
      if (!spaceId) return;
      try {
        await mentorProgressService.cascadeDeletedNodeContent(
          spaceId,
          result.archived_node_ids
        );
        if (showSpaceProgress) {
          void refreshMentorSpaceProgress();
        }
      } catch {
        // Best-effort content retire + progress sync.
      }
    },
    [archiveNode, spaceId, showSpaceProgress, refreshMentorSpaceProgress]
  );

  const handleMentorProgressRefresh = useCallback(() => {
    if (showSpaceProgress) {
      void refreshMentorSpaceProgress();
    }
  }, [showSpaceProgress, refreshMentorSpaceProgress]);

  const handleRepublishContentPublished = useCallback(
    (nodeId: string) => {
      setNodeContentRefreshTokens((prev) => ({
        ...prev,
        [nodeId]: (prev[nodeId] ?? 0) + 1,
      }));
      handleMentorProgressRefresh();
    },
    [handleMentorProgressRefresh],
  );

  useEffect(() => {
    if (!spaceId) return;

    // Reset space-specific UI state when switching spaces
    setSelectedNode(null);
    setShowInviteModal(false);
    setIsPublishing(false);
    setIsEditingName(false);
    setEditName("");
    setEditDesc("");
    setIsSavingEdit(false);
    setShowManageTrainees(false);
    setUnpublishPreview(null);
    setIsLoadingUnpublishPreview(false);
    setRepublishChecklist(null);
    setNodeContentRefreshTokens({});
    setIsMoveMode(false);
    setTreePanelWidth(280);
    setIsTopicPanelVisible(true);
    setNodeStudyStates(new Map());
    setShowSpaceProgress(false);
    setCameFromSpaceProgress(false);
    setShowRootPickerModal(false);
    setShowPolicyModal(false);
    setShowWarningModal(false);
    setSelectedBatchNodeIds([]);
    setBatchPreview(null);
    setExistingPolicy("skip");
    setIsSubmittingBatchFlow(false);
    setActiveBatchId(null);
    setShowBatchProgressPanel(false);
    setBatchHubEnabled(false);
    batchHubDismissedRef.current = false;
    completedBatchStepIdsRef.current = new Set();
    settledBatchStepIdsRef.current = new Set();
    batchAutoOpenedMaterialNodeIdsRef.current = new Set();

    const load = async () => {
      setIsLoadingSpace(true);
      try {
        const [s] = await Promise.all([
          spaceService.getSpace(spaceId),
          fetchTree(spaceId),
        ]);
        setSpace(s);
        setEditName(s.space_name);
        setEditDesc(s.description ?? "");
      } catch (err) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to load space.");
        navigate(`/${role}/spaces`);
      } finally {
        setIsLoadingSpace(false);
      }
    };
    load();
  }, [spaceId]);

  useEffect(() => {
    if (treeError) {
      toast.error(treeError);
      clearTreeError();
    }
  }, [treeError]);

  useEffect(() => {
    if (isMentor || !spaceId) return;
    const handleUnlocked = (event: Event) => {
      const custom = event as CustomEvent<TraineeNodesUnlockedDetail>;
      if (custom.detail?.spaceId !== spaceId) return;
      void fetchTree(spaceId);
    };
    window.addEventListener(TRAINEE_NODES_UNLOCKED_EVENT, handleUnlocked);
    return () => {
      window.removeEventListener(TRAINEE_NODES_UNLOCKED_EVENT, handleUnlocked);
    };
  }, [isMentor, spaceId, fetchTree]);

  const handleTraineeNodesUnlocked = useCallback(
    (_nodeIds: string[]) => {
      if (!spaceId) return;
      void fetchTree(spaceId);
    },
    [spaceId, fetchTree],
  );

  useEffect(() => {
    if (traineeSpaceProgressError) {
      toast.error(traineeSpaceProgressError);
    }
  }, [traineeSpaceProgressError]);

  useEffect(() => {
    if (mentorSpaceProgressError) {
      toast.error(mentorSpaceProgressError);
    }
  }, [mentorSpaceProgressError]);

  // Restore selected topic from ?node= when returning from quiz or deep-linking.
  useEffect(() => {
    if (isMentor || roots.length === 0) return;
    if (showSpaceProgress) return;
    const nodeIdFromUrl = searchParams.get("node");
    if (!nodeIdFromUrl) return;
    const node = findNodeInTree(roots, nodeIdFromUrl);
    if (node) {
      if (selectedNode?.node_id !== nodeIdFromUrl) {
        setSelectedNode(node);
      }
    } else {
      // Stale deep-link after the topic was deleted.
      setSearchParams({}, { replace: true });
    }
  }, [isMentor, roots, searchParams, selectedNode?.node_id, showSpaceProgress, setSearchParams]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const MIN_TREE = 260;
      const MAX_TREE = 380;
      const MIN_MAIN = 560;
      const maxWidth = Math.min(
        MAX_TREE,
        Math.max(MIN_TREE, rect.width - MIN_MAIN)
      );
      const next = Math.min(maxWidth, Math.max(MIN_TREE, e.clientX - rect.left));
      setTreePanelWidth(next);
    };
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startTreeResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleTreeResizeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const availableWidth = bodyRef.current?.getBoundingClientRect().width;
    const maxWidth = availableWidth
      ? Math.min(380, Math.max(260, availableWidth - 560))
      : 380;
    const delta = e.key === "ArrowLeft" ? -20 : 20;
    setTreePanelWidth((width) => Math.min(maxWidth, Math.max(260, width + delta)));
  };

  const loadRepublishChecklist = async (id: string) => {
    try {
      const checklist = await studyMaterialService.getRepublishChecklist(id);
      if (checklist.nodes_with_publishable_material.length > 0) {
        setRepublishChecklist(checklist.nodes_with_publishable_material);
      }
    } catch {
      // Non-blocking — space publish still succeeded.
    }
  };

  const handlePublishSpace = async () => {
    if (!space || !spaceId) return;
    setIsPublishing(true);
    try {
      const updated = await spaceService.publishSpace(spaceId, { is_published: true });
      setSpace(updated);
      toast.success("Space published!");
      await loadRepublishChecklist(spaceId);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to publish space.");
      throw err;
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishSpace = async () => {
    if (!space || !spaceId) return;
    setIsPublishing(true);
    try {
      const updated = await spaceService.publishSpace(spaceId, { is_published: false });
      setSpace(updated);
      setUnpublishPreview(null);
      await mentorProgressService.syncSpaceProgress(spaceId);
      if (showSpaceProgress) {
        void refreshMentorSpaceProgress();
      }
      toast.success("Space unpublished.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to unpublish space.");
      throw err;
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishClick = async () => {
    if (!space || !spaceId) return;
    if (space.is_published) {
      setIsLoadingUnpublishPreview(true);
      try {
        const preview = await spaceService.previewUnpublish(spaceId);
        setUnpublishPreview(preview);
      } catch {
        toast.error("Failed to load unpublish preview.");
      } finally {
        setIsLoadingUnpublishPreview(false);
      }
    } else {
      void handlePublishSpace();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await spaceService.updateSpace(spaceId, {
        space_name: editName.trim(),
        description: editDesc.trim() || null,
      });
      setSpace(updated);
      setIsEditingName(false);
      toast.success("Space updated!");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Update failed.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const selectNode = useCallback(
    (node: NodeTreeNode | null) => {
      setSelectedNode(node);
      setCameFromSpaceProgress(false);
      if (node) setShowSpaceProgress(false);

      // Batch parent hub: cohort parent with children → Material page 2 in hub mode (not leaf drill).
      if (
        isMentor &&
        node &&
        batchHubEnabled &&
        spaceBatchDetail &&
        isBatchHubEligibleNode(node, spaceBatchDetail.steps)
      ) {
        updateNodeStudyState(node.node_id, {
          currentPage: 2,
          isGenerating: false,
        });
        const parentStep = findBatchStepForNode(spaceBatchDetail.steps, node.node_id);
        if (
          parentStep &&
          (parentStep.status === "completed" || parentStep.status === "skipped")
        ) {
          void studyMaterialService
            .getActiveVersion(node.node_id)
            .then((version) => {
              if (!version) return;
              updateNodeStudyState(node.node_id, {
                currentPage: 2,
                isGenerating: false,
                hasTriggeredGeneration: true,
                studyMaterialContent: version.content,
                activeVersion: version,
              });
            })
            .catch(() => {
              // Hub still opens; material loads on banner drill if needed.
            });
        }
      } else if (isMentor && node && batchStepStatusByNodeId[node.node_id] === "completed") {
        // Leaf / non-hub completed step: open Material workspace as today.
        updateNodeStudyState(node.node_id, {
          currentPage: 2,
          isGenerating: false,
          hasTriggeredGeneration: true,
        });
        void studyMaterialService.getActiveVersion(node.node_id).then((version) => {
          if (!version) return;
          updateNodeStudyState(node.node_id, {
            currentPage: 2,
            isGenerating: false,
            hasTriggeredGeneration: true,
            studyMaterialContent: version.content,
            activeVersion: version,
          });
        }).catch(() => {
          // The Material page will use its normal loading/recovery path.
        });
      }
      if (!isMentor && spaceId) {
        if (node) {
          setSearchParams({ node: node.node_id }, { replace: true });
        } else {
          setSearchParams({}, { replace: true });
        }
      }
    },
    [
      isMentor,
      spaceId,
      setSearchParams,
      batchStepStatusByNodeId,
      batchHubEnabled,
      spaceBatchDetail,
      updateNodeStudyState,
    ],
  );

  // Keep selected node in sync after tree changes (e.g. move/reorder/delete).
  // If the selected topic was removed (or its ancestor), return to the empty canvas.
  useEffect(() => {
    if (!selectedNode) return;
    if (roots.length === 0) {
      selectNode(null);
      return;
    }
    const updated = findNodeInTree(roots, selectedNode.node_id);
    if (!updated) {
      selectNode(null);
    } else if (updated !== selectedNode) {
      setSelectedNode(updated);
    }
  }, [roots, selectedNode, selectNode]);

  const handleNavigateToNode = useCallback(
    (nodeId: string) => {
      const node = findNodeInTree(roots, nodeId);
      if (node) selectNode(node);
    },
    [roots, selectNode],
  );

  // Sync batch step progress into per-node study state. Do not change the
  // selected topic — users should browse freely while generate-all runs.
  useEffect(() => {
    if (!batchDetail || roots.length === 0) return;

    for (const step of batchDetail.steps) {
      if (step.status === "running") {
        const runningPatch: Partial<NodeStudyState> = {
          isGenerating: true,
          generationProgressSessionId: step.generation_run_id,
          activeGenerationRunId: step.generation_run_id,
        };
        if (selectedNode?.node_id === step.node_id) {
          runningPatch.currentPage = 2;
        }
        updateNodeStudyState(step.node_id, runningPatch);
      }

      if (step.status === "completed" && !completedBatchStepIdsRef.current.has(step.step_id)) {
        completedBatchStepIdsRef.current.add(step.step_id);
        settledBatchStepIdsRef.current.add(step.step_id);
        setNodeContentRefreshTokens((prev) => ({
          ...prev,
          [step.node_id]: (prev[step.node_id] ?? 0) + 1,
        }));
        const completedPatch: Partial<NodeStudyState> = {
          isGenerating: false,
          generationProgressSessionId: null,
          activeGenerationRunId: null,
          hasTriggeredGeneration: true,
        };
        updateNodeStudyState(step.node_id, completedPatch);

        const shouldAutoOpenMaterial =
          selectedNode?.node_id === step.node_id &&
          !batchAutoOpenedMaterialNodeIdsRef.current.has(step.node_id);

        if (shouldAutoOpenMaterial) {
          batchAutoOpenedMaterialNodeIdsRef.current.add(step.node_id);
          const treeNode =
            findNodeInTree(roots, step.node_id) ??
            (selectedNode?.node_id === step.node_id ? selectedNode : null);
          // Hub-eligible parents: page 2 hub mode — do not force material drill.
          if (
            batchHubEnabled &&
            spaceBatchDetail &&
            treeNode &&
            isBatchHubEligibleNode(treeNode, spaceBatchDetail.steps)
          ) {
            updateNodeStudyState(step.node_id, {
              ...completedPatch,
              currentPage: 2,
            });
          } else {
            void studyMaterialService.getActiveVersion(step.node_id).then((version) => {
              if (!version) {
                updateNodeStudyState(step.node_id, { ...completedPatch, currentPage: 2 });
                return;
              }
              updateNodeStudyState(step.node_id, {
                ...completedPatch,
                currentPage: 2,
                studyMaterialContent: version.content,
                activeVersion: version,
              });
            });
          }
        }

        toast.success(`Draft ready: ${step.node_title}`);
      }

      if (
        (step.status === "failed" || step.status === "skipped") &&
        !settledBatchStepIdsRef.current.has(step.step_id)
      ) {
        settledBatchStepIdsRef.current.add(step.step_id);
        const hasResumableRun =
          step.status === "failed" &&
          Boolean(step.generation_run_id) &&
          step.run_status !== "abandoned";
        const terminalPatch: Partial<NodeStudyState> = {
          isGenerating: false,
          generationProgressSessionId: hasResumableRun ? step.generation_run_id : null,
          activeGenerationRunId: hasResumableRun ? step.generation_run_id : null,
          generationRunFailed: hasResumableRun,
          generationRunPaused: false,
          failedGenerationPipeline: hasResumableRun ? "study_material" : null,
          isPausingGeneration: false,
          isAbandoningGeneration: false,
        };
        if (hasResumableRun) {
          terminalPatch.hasTriggeredGeneration = true;
          if (selectedNode?.node_id === step.node_id) terminalPatch.currentPage = 2;
        }
        updateNodeStudyState(step.node_id, terminalPatch);
        if (step.status === "failed") {
          toast.error(
            `${step.node_title}: ${step.error_message ?? "Generation failed. Open the topic to continue or delete the run."}`,
          );
        }
      }
    }
  }, [batchDetail, roots, selectedNode?.node_id, updateNodeStudyState, batchHubEnabled, spaceBatchDetail]);

  const handleNavigateFromSpaceProgress = useCallback(
    (nodeId: string) => {
      const node = findNodeInTree(roots, nodeId);
      if (!node) return;
      setSelectedNode(node);
      setCameFromSpaceProgress(true);
      setShowSpaceProgress(true);
      if (!isMentor && spaceId) {
        setSearchParams({ node: node.node_id }, { replace: true });
      }
    },
    [roots, isMentor, spaceId, setSearchParams],
  );

  const handleNodeRename = useCallback(
    async (nodeId: string, newTitle: string) => {
      const updated = await renameNode(nodeId, { title: newTitle });
      // Keep selected node in sync
      if (selectedNode && selectedNode.node_id === nodeId) {
        setSelectedNode((prev) =>
          prev
            ? {
                ...prev,
                title: updated.title,
                effective_instruction: updated.effective_instruction,
                effective_instruction_parts: updated.effective_instruction_parts,
              }
            : prev
        );
      }
    },
    [renameNode, selectedNode]
  );

  const handleUpdateInstruction = useCallback(
    async (nodeId: string, payload: NodeUpdateInstructionRequest) => {
      const updated = await updateNodeInstruction(nodeId, payload);
      if (selectedNode && selectedNode.node_id === nodeId) {
        setSelectedNode((prev) =>
          prev
            ? {
                ...prev,
                node_specific_instruction: updated.node_specific_instruction,
                tree_default_instruction: updated.tree_default_instruction,
                node_additive_instruction: updated.node_additive_instruction,
                effective_instruction: updated.effective_instruction,
                effective_instruction_parts: updated.effective_instruction_parts,
              }
            : prev
        );
      }
    },
    [updateNodeInstruction, selectedNode]
  );

  const closeBatchWizard = useCallback(() => {
    setShowRootPickerModal(false);
    setShowPolicyModal(false);
    setShowWarningModal(false);
    setBatchPreview(null);
    setSelectedBatchNodeIds([]);
    setSelectedBatchExternalResearchNodeIds([]);
  }, []);

  const setExternalResearchForNode = useCallback((nodeId: string, enabled: boolean) => {
    setExternalResearchByNodeId((prev) => {
      if (Boolean(prev[nodeId]) === enabled) return prev;
      return { ...prev, [nodeId]: enabled };
    });
  }, []);

  const startGenerateAllFromWizard = useCallback(async (policy: ExistingMaterialPolicy) => {
    if (!spaceId || selectedBatchNodeIds.length === 0) return;
    const eligibleNodeIds = batchPreview
      ? batchPreview.items.filter((item) => item.can_generate).map((item) => item.node_id)
      : selectedBatchNodeIds;
    if (eligibleNodeIds.length === 0) {
      toast.error("None of the selected topics can be queued for generation.");
      return;
    }
    const eligibleSet = new Set(eligibleNodeIds);
    const externalResearchNodeIds = selectedBatchExternalResearchNodeIds.filter((id) =>
      eligibleSet.has(id),
    );

    setIsSubmittingBatchFlow(true);
    closeBatchWizard();

    try {
      const created = await studyMaterialBatchService.createBatch(spaceId, {
        root_node_ids: [],
        node_ids: eligibleNodeIds,
        policy,
        external_research_node_ids: externalResearchNodeIds,
      });
      batchHubDismissedRef.current = false;
      writeBatchHubSession(spaceId, created.batch_id);
      setBatchHubEnabled(true);
      setActiveBatchId(created.batch_id);
      setShowBatchProgressPanel(true);
      completedBatchStepIdsRef.current = new Set();
      settledBatchStepIdsRef.current = new Set();
      batchAutoOpenedMaterialNodeIdsRef.current = new Set();
      toast.success(
        "Generate-all started. Progress continues in the background — you can close this tab.",
      );
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to start generate-all batch.");
    } finally {
      setIsSubmittingBatchFlow(false);
    }
  }, [
    spaceId,
    selectedBatchNodeIds,
    selectedBatchExternalResearchNodeIds,
    batchPreview,
    closeBatchWizard,
  ]);

  const handleContinueRootPicker = useCallback(async (selection: {
    nodeIds: string[];
    externalResearchNodeIds: string[];
  }) => {
    if (!spaceId || selection.nodeIds.length === 0) return;
    setIsSubmittingBatchFlow(true);
    try {
      const preview = await studyMaterialBatchService.preview(spaceId, {
        root_node_ids: [],
        node_ids: selection.nodeIds,
      });
      setBatchPreview(preview);
      setSelectedBatchNodeIds(selection.nodeIds);
      setSelectedBatchExternalResearchNodeIds(selection.externalResearchNodeIds);
      setExternalResearchByNodeId((prev) => {
        const next = { ...prev };
        for (const nodeId of selection.nodeIds) {
          next[nodeId] = selection.externalResearchNodeIds.includes(nodeId);
        }
        return next;
      });
      setShowRootPickerModal(false);
      setShowPolicyModal(true);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to preview generation plan.");
    } finally {
      setIsSubmittingBatchFlow(false);
    }
  }, [spaceId]);

  const handlePolicyContinue = useCallback(async (policy: ExistingMaterialPolicy) => {
    setExistingPolicy(policy);
    if (batchPreview?.warnings.show_no_instruction_warning || batchPreview?.warnings.show_inheritance_warning) {
      setShowPolicyModal(false);
      setShowWarningModal(true);
      return;
    }
    await startGenerateAllFromWizard(policy);
  }, [batchPreview, startGenerateAllFromWizard]);

  if (isLoadingSpace) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span
          className="spinner"
          style={{
            borderTopColor: "var(--color-primary)",
            width: "2.5rem",
            height: "2.5rem",
          }}
        />
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Loading space…
        </p>
      </div>
    );
  }

  if (!space) return null;

  const moveBlurOverlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(247, 248, 250, 0.6)",
    backdropFilter: "blur(3px)",
    zIndex: 10,
    pointerEvents: "auto",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--color-bg-page)",
      }}
    >
      <button
        type="button"
        className="space-topic-panel-toggle"
        onClick={() => setIsTopicPanelVisible((visible) => !visible)}
        aria-controls="space-topic-panel"
        aria-expanded={isTopicPanelVisible}
        aria-label={isTopicPanelVisible ? "Hide topic outline" : "Show topic outline"}
        title={isTopicPanelVisible ? "Hide topic outline" : "Show topic outline"}
      >
        <i
          className={isTopicPanelVisible ? "ti ti-layout-sidebar-left-collapse" : "ti ti-list-tree"}
          aria-hidden="true"
        />
      </button>

      {/* ── Top header ── */}
      <header
        style={{
          padding: "0 1.5rem",
          height: "60px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "var(--color-bg-surface)",
          boxShadow: "var(--shadow-subtle)",
          flexShrink: 0,
          zIndex: 10,
          position: "relative",
        }}
      >
        {isMoveMode && <div style={moveBlurOverlay} aria-hidden />}
        {/* Back */}
        <button
          onClick={() => navigate(`/${role}/spaces`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "0.375rem",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          title="Back to spaces"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Space name / edit */}
        {isEditingName ? (
          <form
            onSubmit={handleSaveEdit}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}
          >
            <input
              autoFocus
              className="input-field"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ fontSize: "0.9375rem", fontWeight: 600, width: "220px" }}
              maxLength={200}
              onKeyDown={(e) => { if (e.key === "Escape") { setIsEditingName(false); setEditName(space.space_name); } }}
            />
            <input
              className="input-field"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              style={{ fontSize: "0.8125rem", width: "200px" }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "0.375rem 0.75rem", flexShrink: 0 }}
              disabled={isSavingEdit || !editName.trim()}
            >
              {isSavingEdit ? <span className="spinner" style={{ width: "1rem", height: "1rem" }} /> : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setIsEditingName(false); setEditName(space.space_name); }}
              className="btn-secondary"
              style={{ padding: "0.375rem 0.625rem", flexShrink: 0 }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {space.space_name}
              </h1>
              {space.description && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {space.description}
                </p>
              )}
            </div>
            {isMentor && (
              <button
                onClick={() => { setIsEditingName(true); setEditName(space.space_name); setEditDesc(space.description ?? ""); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "0.25rem",
                  borderRadius: "var(--radius-sm)",
                  flexShrink: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                title="Edit space name"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {cameFromSpaceProgress && selectedNode && (
            <button
              type="button"
              onClick={() => {
                setSelectedNode(null);
                setShowSpaceProgress(true);
                setCameFromSpaceProgress(false);
              }}
              className="btn-secondary"
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
            >
              <i
                className="ti ti-chevron-right"
                aria-hidden="true"
                style={{ transform: "rotate(180deg)" }}
              />
              Back to per topic breakdown
            </button>
          )}

          {!isMentor && !(cameFromSpaceProgress && selectedNode) && (
            <button
              type="button"
              onClick={() => {
                const next = !showSpaceProgress;
                setShowSpaceProgress(next);
                if (next) {
                  setSelectedNode(null);
                  setCameFromSpaceProgress(false);
                  // Prevent URL-driven node auto-restore while showing the panel.
                  setSearchParams({}, { replace: true });
                  void refreshTraineeSpaceProgress();
                }
              }}
              className={showSpaceProgress ? "btn-primary" : "btn-secondary"}
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
            >
              {showSpaceProgress
                ? "Hide overall space progress"
                : "Show overall space progress"}
            </button>
          )}

          {isMentor && !(cameFromSpaceProgress && selectedNode) && (
            <button
              type="button"
              onClick={() => {
                const next = !showSpaceProgress;
                setShowSpaceProgress(next);
                if (next) {
                  setSelectedNode(null);
                  setCameFromSpaceProgress(false);
                  // Prevent URL-driven node auto-restore while showing the panel.
                  setSearchParams({}, { replace: true });
                  void refreshMentorSpaceProgress();
                }
              }}
              className={showSpaceProgress ? "btn-primary" : "btn-secondary"}
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
            >
              {showSpaceProgress
                ? "Hide overall space progress"
                : "Show overall space progress"}
            </button>
          )}

          {isMentor && (
            <button
              onClick={() => void handlePublishClick()}
              className={space.is_published ? "btn-danger" : "btn-primary"}
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
              disabled={isPublishing || isLoadingUnpublishPreview}
            >
              {isPublishing || isLoadingUnpublishPreview ? (
                <span
                  className="spinner"
                  style={{
                    borderTopColor: space.is_published ? "var(--color-danger)" : "var(--color-primary)",
                    width: "1rem",
                    height: "1rem",
                  }}
                />
              ) : space.is_published ? (
                "Unpublish"
              ) : (
                "Publish Space"
              )}
            </button>
          )}

          {/* Share invite code button */}
          {isMentor && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-secondary"
              style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              title="Share invite code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          )}

          {/* Manage Trainees */}
          {isMentor && (
            <button
              onClick={() => setShowManageTrainees(true)}
              className="btn-primary"
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Manage Learners
            </button>
          )}
        </div>
      </header>

      {/* ── Two-panel body ── */}
      <div
        ref={bodyRef}
        className={!isMentor ? "trainee-space-detail-body" : undefined}
        style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
      >
        {/* Left: Topic tree panel */}
        <aside
          id="space-topic-panel"
          className={`space-topic-panel${isTopicPanelVisible ? "" : " space-topic-panel--hidden"}`}
          aria-label="Topic outline"
          aria-hidden={!isTopicPanelVisible}
          style={{
            width: isTopicPanelVisible ? `${treePanelWidth}px` : 0,
            minWidth: isTopicPanelVisible ? "260px" : 0,
            background: "var(--color-bg-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {isLoadingTree ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: "0.75rem",
                flexDirection: "column",
              }}
            >
              <span
                className="spinner"
                style={{ borderTopColor: "var(--color-primary)", width: "2rem", height: "2rem" }}
              />
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 }}>
                Loading topics…
              </p>
            </div>
          ) : isMentor ? (
            <TopicTree
              spaceId={spaceId!}
              roots={roots}
              selectedNodeId={selectedNode?.node_id ?? null}
              onSelectNode={selectNode}
              onCreate={createNode}
              onRename={(nodeId, payload) => renameNode(nodeId, payload)}
              onMove={reparentNode}
              onReorder={(nodeId, direction) => reorderNode(spaceId!, nodeId, direction)}
              onArchive={handleArchiveNode}
              isMentor={isMentor}
              onMoveModeChange={setIsMoveMode}
              isCompact={treePanelWidth < 300}
              onGenerateAll={() => setShowRootPickerModal(true)}
              isGenerateAllDisabled={isSubmittingBatchFlow || roots.length === 0}
              isGenerateAllSubmitting={isSubmittingBatchFlow}
            />
          ) : (
            <TraineeTopicTree
              roots={roots}
              selectedNodeId={selectedNode?.node_id ?? null}
              onSelectNode={selectNode}
            />
          )}
        </aside>

        {/* Resize handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize topic outline panel"
          aria-valuemin={260}
          aria-valuemax={380}
          aria-valuenow={treePanelWidth}
          aria-hidden={!isTopicPanelVisible}
          tabIndex={isTopicPanelVisible ? 0 : -1}
          onMouseDown={startTreeResize}
          onKeyDown={handleTreeResizeKeyDown}
          className={`panel-resize-handle${isTopicPanelVisible ? "" : " panel-resize-handle--hidden"}`}
          title="Drag to resize"
        />

        {/* Right: Node detail panel */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {isMoveMode && <div style={moveBlurOverlay} aria-hidden />}
          {isMentor ? (
            showSpaceProgress && !selectedNode ? (
              isLoadingMentorSpaceProgress ? (
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
                </div>
              ) : mentorSpaceProgress ? (
                <MentorSpaceProgressPanel
                  progress={mentorSpaceProgress}
                  onNavigateNode={handleNavigateFromSpaceProgress}
                />
              ) : (
                <NodeDetailPanel
                  node={selectedNode}
                  hasTopics={roots.length > 0}
                  spaceId={spaceId ?? ""}
                  spaceIsPublished={space.is_published}
                  onRename={handleNodeRename}
                  onUpdateInstruction={handleUpdateInstruction}
                  onNavigateToNode={handleNavigateToNode}
                  isMentor={isMentor}
                  studyState={undefined}
                  onStudyStateChange={undefined}
                  onMentorProgressRefresh={handleMentorProgressRefresh}
                  batchDetail={spaceBatchDetail}
                  batchHubEnabled={batchHubEnabled}
                  onDismissBatchHub={handleDismissBatchHub}
                />
              )
            ) : (
              <NodeDetailPanel
                node={selectedNode}
                hasTopics={roots.length > 0}
                spaceId={spaceId ?? ""}
                spaceIsPublished={space.is_published}
                onRename={handleNodeRename}
                onUpdateInstruction={handleUpdateInstruction}
                onNavigateToNode={handleNavigateToNode}
                isMentor={isMentor}
                studyState={selectedNode ? getNodeStudyState(selectedNode.node_id) : undefined}
                onStudyStateChange={selectedNode ? handleStudyStateChange : undefined}
                onMentorProgressRefresh={handleMentorProgressRefresh}
                externalResearchEnabled={
                  selectedNode ? Boolean(externalResearchByNodeId[selectedNode.node_id]) : false
                }
                onExternalResearchChange={(enabled) => {
                  if (!selectedNode) return;
                  setExternalResearchForNode(selectedNode.node_id, enabled);
                }}
                contentRefreshToken={
                  selectedNode ? nodeContentRefreshTokens[selectedNode.node_id] ?? 0 : 0
                }
                isWaitingForGenerateAll={
                  Boolean(
                    selectedNode &&
                      (batchStepStatusByNodeId[selectedNode.node_id] === "pending" ||
                        batchStepStatusByNodeId[selectedNode.node_id] === "running"),
                  )
                }
                batchStepStatus={
                  selectedNode ? batchStepStatusByNodeId[selectedNode.node_id] ?? null : null
                }
                batchDetail={spaceBatchDetail}
                batchHubEnabled={batchHubEnabled}
                onDismissBatchHub={handleDismissBatchHub}
              />
            )
          ) : (
            <>
              {showSpaceProgress && !selectedNode ? (
                isLoadingTraineeSpaceProgress ? (
                  <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                    <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
                  </div>
                ) : traineeSpaceProgress ? (
                  <SpaceProgressPanel
                    progress={traineeSpaceProgress}
                    onNavigateNode={handleNavigateFromSpaceProgress}
                  />
                ) : (
                  <TraineeNodeDetailPanel
                    node={selectedNode}
                    hasTopics={roots.length > 0}
                    spaceId={spaceId ?? ""}
                    onNavigateToNode={handleNavigateToNode}
                    onNodesUnlocked={handleTraineeNodesUnlocked}
                  />
                )
              ) : (
                <TraineeNodeDetailPanel
                  node={selectedNode}
                  hasTopics={roots.length > 0}
                  spaceId={spaceId ?? ""}
                  onNavigateToNode={handleNavigateToNode}
                  onNodesUnlocked={handleTraineeNodesUnlocked}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Invite code modal ── */}
      {showInviteModal && space.invite_code && (
        <InviteCodeModal
          inviteCode={space.invite_code}
          spaceName={space.space_name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ── Manage Trainees modal ── */}
      {showManageTrainees && (
        <ManageTraineesModal
          spaceId={space.space_id}
          onClose={() => setShowManageTrainees(false)}
        />
      )}

      {unpublishPreview && (
        <EspaceUnpublishConfirmModal
          preview={unpublishPreview}
          onClose={() => !isPublishing && setUnpublishPreview(null)}
          onConfirm={() => void handleUnpublishSpace().catch(() => undefined)}
          isSubmitting={isPublishing}
        />
      )}

      {republishChecklist && (
        <EspaceRepublishChecklistModal
          spaceName={space.space_name}
          nodes={republishChecklist}
          onClose={() => setRepublishChecklist(null)}
          onContentPublished={handleRepublishContentPublished}
        />
      )}

      {showRootPickerModal && (
        <GenerateAllRootPickerModal
          roots={roots}
          initialSelectedNodeIds={selectedBatchNodeIds}
          initialExternalResearchByNodeId={externalResearchByNodeId}
          busyNodeIds={busyNodeIds}
          onClose={closeBatchWizard}
          onContinue={(selection) => {
            void handleContinueRootPicker(selection);
          }}
        />
      )}

      {showPolicyModal && (
        <GenerateAllPolicyModal
          defaultPolicy={existingPolicy}
          isSubmitting={isSubmittingBatchFlow}
          blockedItems={batchPreview?.items.filter((item) => !item.can_generate) ?? []}
          onClose={closeBatchWizard}
          onBack={() => {
            setShowPolicyModal(false);
            setShowRootPickerModal(true);
          }}
          onContinue={(policy) => {
            void handlePolicyContinue(policy);
          }}
        />
      )}

      {showWarningModal && batchPreview && (
        <GenerateAllInstructionWarningModal
          warnings={batchPreview.warnings}
          isSubmitting={isSubmittingBatchFlow}
          onClose={closeBatchWizard}
          onBack={() => {
            setShowWarningModal(false);
            setShowPolicyModal(true);
          }}
          onProceed={() => {
            setShowWarningModal(false);
            void startGenerateAllFromWizard(existingPolicy);
          }}
          onCustomize={() => {
            const firstNodeId =
              batchPreview.warnings.missing_instruction_nodes[0]?.node_id ??
              batchPreview.warnings.inherits_section_default_nodes[0]?.node_id;
            closeBatchWizard();
            if (firstNodeId) {
              handleNavigateToNode(firstNodeId);
            }
          }}
        />
      )}

      {showBatchProgressPanel && batchDetail && (
        <BatchProgressPanel
          batchDetail={batchDetail}
          currentRunningStep={currentRunningStep}
          isPolling={isBatchPolling}
          error={batchPollingError}
          onCancel={cancelBatchJob}
          onClose={() => setShowBatchProgressPanel(false)}
        />
      )}
    </div>
  );
};

export default SpaceDetailPage;
