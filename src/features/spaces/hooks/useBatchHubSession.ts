import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { studyMaterialBatchService } from "../../study_material/services/studyMaterialBatchService";
import type { BatchDetailOut } from "../../study_material/types/studyMaterialBatch.types";
import {
  clearBatchHubSession,
  readBatchHubSession,
  writeBatchHubSession,
} from "../../study_material/utils/batchHubSession";

type UseBatchHubSessionParams = {
  spaceId: string | undefined;
  isMentor: boolean;
  spaceBatchDetail: BatchDetailOut | null;
  setActiveBatchId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowBatchProgressPanel: (show: boolean) => void;
};

/**
 * Batch hub session restore / persist / dismiss (extract-only from SpaceDetailPage).
 * Step→study-state sync stays on the page (needs tree + selectNode context).
 */
export function useBatchHubSession({
  spaceId,
  isMentor,
  spaceBatchDetail,
  setActiveBatchId,
  setShowBatchProgressPanel,
}: UseBatchHubSessionParams) {
  const [batchHubEnabled, setBatchHubEnabled] = useState(false);
  const batchHubDismissedRef = useRef(false);

  // Resume in-flight batch after reload / space switch.
  // Terminal session restore keeps batchDetail for hub only — do not open the progress panel.
  useEffect(() => {
    if (!spaceBatchDetail) return;
    const { batch_id: batchId, status } = spaceBatchDetail.batch;
    if (status === "pending" || status === "running") {
      setActiveBatchId((prev) => (prev === batchId ? prev : batchId));
      setShowBatchProgressPanel(true);
    }
  }, [spaceBatchDetail, setActiveBatchId, setShowBatchProgressPanel]);

  // Persist cohort while hub context is active (refreshes TTL; skipped after dismiss).
  useEffect(() => {
    if (!spaceId || !isMentor || !spaceBatchDetail || !batchHubEnabled) return;
    writeBatchHubSession(spaceId, spaceBatchDetail.batch.batch_id);
  }, [spaceId, isMentor, spaceBatchDetail, batchHubEnabled]);

  // Restore hub cohort from active batch or sessionStorage after reload.
  useEffect(() => {
    if (!spaceId || !isMentor) return;
    let cancelled = false;

    const restoreBatchHubCohort = async () => {
      try {
        const active = await studyMaterialBatchService.getActiveBatch(spaceId);
        if (cancelled || batchHubDismissedRef.current) return;
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
  }, [spaceId, isMentor, setActiveBatchId]);

  const handleDismissBatchHub = useCallback(() => {
    if (!spaceId) return;
    batchHubDismissedRef.current = true;
    clearBatchHubSession(spaceId);
    setBatchHubEnabled(false);
    const status = spaceBatchDetail?.batch.status;
    if (status !== "pending" && status !== "running") {
      setActiveBatchId(null);
    }
  }, [spaceId, spaceBatchDetail?.batch.status, setActiveBatchId]);

  const resetBatchHubOnSpaceChange = useCallback(() => {
    setBatchHubEnabled(false);
    batchHubDismissedRef.current = false;
  }, []);

  return {
    batchHubEnabled,
    setBatchHubEnabled,
    batchHubDismissedRef: batchHubDismissedRef as MutableRefObject<boolean>,
    handleDismissBatchHub,
    resetBatchHubOnSpaceChange,
  };
}
