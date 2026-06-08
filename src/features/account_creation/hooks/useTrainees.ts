// src/features/account_creation/hooks/useTrainees.ts
import { useState, useEffect, useCallback } from "react";
import { accountService } from "../services/accountService";
import type { TraineeListResponse, TraineeOut } from "../types/account.types";
import { usePagination } from "../../../hooks/usePagination";

interface UseTraineesReturn {
  data: TraineeListResponse | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  goToPage: (page: number) => void;
  goToNextPage: (totalPages: number) => void;
  goToPrevPage: () => void;
  refetch: () => void;
  deactivateTrainee: (id: string) => Promise<TraineeOut | null>;
  reactivateTrainee: (id: string) => Promise<TraineeOut | null>;
}

export function useTrainees(defaultLimit = 20): UseTraineesReturn {
  const { page, limit, goToPage, goToNextPage, goToPrevPage } = usePagination({
    initialLimit: defaultLimit,
  });
  const [data, setData] = useState<TraineeListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchTrainees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await accountService.listTrainees(page, limit);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            (err as { response?: { data?: { detail?: string } }; message?: string })
              ?.response?.data?.detail ||
              (err as { message?: string })?.message ||
              "Failed to load trainees."
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchTrainees();
    return () => { cancelled = true; };
  }, [page, limit, refresh]);

  const refetch = useCallback(() => setRefresh((v) => v + 1), []);

  const deactivateTrainee = useCallback(async (id: string): Promise<TraineeOut | null> => {
    try {
      const result = await accountService.deactivateTrainee(id, { isactive: false });
      setRefresh((v) => v + 1);
      return result;
    } catch {
      return null;
    }
  }, []);

  const reactivateTrainee = useCallback(async (id: string): Promise<TraineeOut | null> => {
    try {
      const result = await accountService.reactivateTrainee(id, { isactive: true });
      setRefresh((v) => v + 1);
      return result;
    } catch {
      return null;
    }
  }, []);

  return { data, isLoading, error, page, limit, goToPage, goToNextPage, goToPrevPage, refetch, deactivateTrainee, reactivateTrainee };
}
