import { useCallback, useEffect, useRef, useState } from "react";
import { studyMaterialBatchService } from "../services/studyMaterialBatchService";
import type {
  BatchDetailOut,
  BatchJobStatus,
  BatchStepOut,
} from "../types/studyMaterialBatch.types";

const POLL_INTERVAL_MS = 3000;

const ACTIVE_BATCH_STATUSES: BatchJobStatus[] = ["pending", "running"];

function isActiveBatchStatus(status: BatchJobStatus): boolean {
  return ACTIVE_BATCH_STATUSES.includes(status);
}

export interface UseBatchJobPollResult {
  batchDetail: BatchDetailOut | null;
  steps: BatchStepOut[];
  currentRunningStep: BatchStepOut | null;
  progress: { completed: number; total: number; failed: number; skipped: number };
  isPolling: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  cancel: () => Promise<void>;
}

export function useBatchJobPoll(
  batchId: string | null,
  spaceId: string | null,
): UseBatchJobPollResult {
  const [batchDetail, setBatchDetail] = useState<BatchDetailOut | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedBatchIdRef = useRef<string | null>(batchId);

  const fetchBatch = useCallback(async (id: string) => {
    const detail = await studyMaterialBatchService.getBatch(id);
    setBatchDetail(detail);
    setError(null);
    return detail;
  }, []);

  const refresh = useCallback(async () => {
    const id = resolvedBatchIdRef.current;
    if (!id) return;
    await fetchBatch(id);
  }, [fetchBatch]);

  const cancel = useCallback(async () => {
    const id = resolvedBatchIdRef.current;
    if (!id) return;
    await studyMaterialBatchService.cancelBatch(id);
    await fetchBatch(id);
  }, [fetchBatch]);

  // Resolve batch id from prop or active batch on space load.
  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (batchId) {
        resolvedBatchIdRef.current = batchId;
        try {
          await fetchBatch(batchId);
        } catch (err) {
          if (!cancelled) {
            const e = err as { response?: { data?: { detail?: string } }; message?: string };
            setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load batch.");
          }
        }
        return;
      }

      if (!spaceId) {
        resolvedBatchIdRef.current = null;
        setBatchDetail(null);
        return;
      }

      try {
        const active = await studyMaterialBatchService.getActiveBatch(spaceId);
        if (cancelled) return;
        if (active) {
          resolvedBatchIdRef.current = active.batch.batch_id;
          setBatchDetail(active);
          setError(null);
        } else {
          resolvedBatchIdRef.current = null;
          setBatchDetail(null);
        }
      } catch (err) {
        if (!cancelled) {
          const e = err as { response?: { data?: { detail?: string } }; message?: string };
          setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load active batch.");
        }
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [batchId, spaceId, fetchBatch]);

  // Poll while batch is active.
  useEffect(() => {
    const id = resolvedBatchIdRef.current;
    const status = batchDetail?.batch.status;
    if (!id || !status || !isActiveBatchStatus(status)) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    let cancelled = false;

    const poll = async () => {
      try {
        const detail = await fetchBatch(id);
        if (!cancelled && !isActiveBatchStatus(detail.batch.status)) {
          setIsPolling(false);
        }
      } catch (err) {
        if (!cancelled) {
          const e = err as { response?: { data?: { detail?: string } }; message?: string };
          setError(e?.response?.data?.detail ?? e?.message ?? "Failed to poll batch.");
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [batchDetail?.batch.status, batchDetail?.batch.batch_id, fetchBatch]);

  const steps = batchDetail?.steps ?? [];
  const currentRunningStep = steps.find((step) => step.status === "running") ?? null;
  const batch = batchDetail?.batch;

  return {
    batchDetail,
    steps,
    currentRunningStep,
    progress: {
      completed: batch?.completed_steps ?? 0,
      total: batch?.total_steps ?? 0,
      failed: batch?.failed_steps ?? 0,
      skipped: batch?.skipped_steps ?? 0,
    },
    isPolling,
    error,
    refresh,
    cancel,
  };
}
