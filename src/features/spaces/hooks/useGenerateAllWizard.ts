import { useCallback, useState, type MutableRefObject } from "react";
import toast from "react-hot-toast";
import { studyMaterialBatchService } from "../../study_material/services/studyMaterialBatchService";
import type {
  BatchPreviewResponse,
  ExistingMaterialPolicy,
} from "../../study_material/types/studyMaterialBatch.types";
import { writeBatchHubSession } from "../../study_material/utils/batchHubSession";

type UseGenerateAllWizardParams = {
  spaceId: string | undefined;
  batchHubDismissedRef: MutableRefObject<boolean>;
  completedBatchStepIdsRef: MutableRefObject<Set<string>>;
  settledBatchStepIdsRef: MutableRefObject<Set<string>>;
  batchAutoOpenedMaterialNodeIdsRef: MutableRefObject<Set<string>>;
  seededBatchToastIdRef: MutableRefObject<string | null>;
  setBatchHubEnabled: (enabled: boolean) => void;
  setActiveBatchId: (batchId: string | null) => void;
  setShowBatchProgressPanel: (show: boolean) => void;
  setExternalResearchByNodeId: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
};

/**
 * Generate All wizard state + handlers (extract-only from SpaceDetailPage).
 */
export function useGenerateAllWizard({
  spaceId,
  batchHubDismissedRef,
  completedBatchStepIdsRef,
  settledBatchStepIdsRef,
  batchAutoOpenedMaterialNodeIdsRef,
  seededBatchToastIdRef,
  setBatchHubEnabled,
  setActiveBatchId,
  setShowBatchProgressPanel,
  setExternalResearchByNodeId,
}: UseGenerateAllWizardParams) {
  const [showRootPickerModal, setShowRootPickerModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedBatchNodeIds, setSelectedBatchNodeIds] = useState<string[]>([]);
  const [selectedBatchExternalResearchNodeIds, setSelectedBatchExternalResearchNodeIds] =
    useState<string[]>([]);
  const [batchPreview, setBatchPreview] = useState<BatchPreviewResponse | null>(null);
  const [existingPolicy, setExistingPolicy] = useState<ExistingMaterialPolicy>("skip");
  const [isSubmittingBatchFlow, setIsSubmittingBatchFlow] = useState(false);

  const closeBatchWizard = useCallback(() => {
    setShowRootPickerModal(false);
    setShowPolicyModal(false);
    setShowWarningModal(false);
    setBatchPreview(null);
    setSelectedBatchNodeIds([]);
    setSelectedBatchExternalResearchNodeIds([]);
  }, []);

  const resetWizardOnSpaceChange = useCallback(() => {
    setShowRootPickerModal(false);
    setShowPolicyModal(false);
    setShowWarningModal(false);
    setSelectedBatchNodeIds([]);
    setSelectedBatchExternalResearchNodeIds([]);
    setBatchPreview(null);
    setExistingPolicy("skip");
    setIsSubmittingBatchFlow(false);
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
      seededBatchToastIdRef.current = null;
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
    batchHubDismissedRef,
    completedBatchStepIdsRef,
    settledBatchStepIdsRef,
    batchAutoOpenedMaterialNodeIdsRef,
    seededBatchToastIdRef,
    setBatchHubEnabled,
    setActiveBatchId,
    setShowBatchProgressPanel,
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
  }, [spaceId, setExternalResearchByNodeId]);

  const handlePolicyContinue = useCallback(async (policy: ExistingMaterialPolicy) => {
    setExistingPolicy(policy);
    if (batchPreview?.warnings.show_no_instruction_warning || batchPreview?.warnings.show_inheritance_warning) {
      setShowPolicyModal(false);
      setShowWarningModal(true);
      return;
    }
    await startGenerateAllFromWizard(policy);
  }, [batchPreview, startGenerateAllFromWizard]);

  return {
    showRootPickerModal,
    setShowRootPickerModal,
    showPolicyModal,
    setShowPolicyModal,
    showWarningModal,
    setShowWarningModal,
    selectedBatchNodeIds,
    batchPreview,
    existingPolicy,
    isSubmittingBatchFlow,
    closeBatchWizard,
    resetWizardOnSpaceChange,
    startGenerateAllFromWizard,
    handleContinueRootPicker,
    handlePolicyContinue,
  };
}
