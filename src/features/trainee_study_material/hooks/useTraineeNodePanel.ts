import { useCallback, useEffect, useState } from "react";
import type { TraineeNodePanelOut } from "../types/traineeNodePanel.types";
import { traineeNodePanelService } from "../services/traineeNodePanelService";

interface UseTraineeNodePanelParams {
  nodeId: string | null;
}

function extractErrorDetail(err: unknown): string {
  const e = err as { response?: { data?: string | { detail?: string } }; message?: string };
  if (typeof e?.response?.data === "string") return e.response.data;
  return e?.response?.data?.detail ?? e?.message ?? "Request failed.";
}

export function useTraineeNodePanel({ nodeId }: UseTraineeNodePanelParams) {
  const [panel, setPanel] = useState<TraineeNodePanelOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!nodeId) {
      setPanel(null);
      setLoadError(null);
      return;
    }

    const silent = opts?.silent === true;
    if (!silent) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const data = await traineeNodePanelService.getPanel(nodeId);
      setPanel(data);
    } catch (err) {
      setPanel(null);
      setLoadError(extractErrorDetail(err));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [nodeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { panel, isLoading, loadError, refresh };
}
