// src/features/account_creation/hooks/useCreateMentor.ts
import { useState, useCallback } from "react";
import { accountService } from "../services/accountService";
import type { MentorCreate, MentorOut } from "../types/account.types";

interface UseCreateMentorReturn {
  isLoading: boolean;
  error: string | null;
  createMentor: (payload: MentorCreate) => Promise<MentorOut | null>;
  clearError: () => void;
}

export function useCreateMentor(): UseCreateMentorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMentor = useCallback(
    async (payload: MentorCreate): Promise<MentorOut | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await accountService.createMentor(payload);
        return result;
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ||
          (err as { message?: string })?.message ||
          "Failed to create mentor.";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);
  return { isLoading, error, createMentor, clearError };
}
