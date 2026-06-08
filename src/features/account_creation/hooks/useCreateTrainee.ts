// src/features/account_creation/hooks/useCreateTrainee.ts
import { useState, useCallback } from "react";
import { accountService } from "../services/accountService";
import type { TraineeCreate, TraineeOut } from "../types/account.types";

interface UseCreateTraineeReturn {
  isLoading: boolean;
  error: string | null;
  createTrainee: (payload: TraineeCreate) => Promise<TraineeOut | null>;
  clearError: () => void;
}

export function useCreateTrainee(): UseCreateTraineeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTrainee = useCallback(
    async (payload: TraineeCreate): Promise<TraineeOut | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await accountService.createTrainee(payload);
        return result;
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ||
          (err as { message?: string })?.message ||
          "Failed to create trainee.";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);
  return { isLoading, error, createTrainee, clearError };
}
