import { useCallback, useEffect, useState } from "react";
import type { PublishedQuizDiscoveryOut } from "../types/traineeQuiz.types";
import { traineeQuizService } from "../services/traineeQuizService";

interface UseTraineeQuizDiscoveryOptions {
  nodeId: string;
  enabled?: boolean;
}

export function useTraineeQuizDiscovery({ nodeId, enabled = true }: UseTraineeQuizDiscoveryOptions) {
  const [discovery, setDiscovery] = useState<PublishedQuizDiscoveryOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !nodeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await traineeQuizService.getPublishedQuizState(nodeId);
      setDiscovery(data);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load quiz info.");
      setDiscovery(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, nodeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasPublishedQuiz = Boolean(discovery?.quiz_id);

  return {
    discovery,
    isLoading,
    error,
    hasPublishedQuiz,
    refresh,
  };
}
