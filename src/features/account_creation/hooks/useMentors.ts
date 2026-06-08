// src/features/account_creation/hooks/useMentors.ts
import { useState, useEffect, useCallback } from "react";
import { accountService } from "../services/accountService";
import type { MentorListResponse, MentorOut } from "../types/account.types";
import { usePagination } from "../../../hooks/usePagination";

interface UseMentorsReturn {
  data: MentorListResponse | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  goToPage: (page: number) => void;
  goToNextPage: (totalPages: number) => void;
  goToPrevPage: () => void;
  refetch: () => void;
  deactivateMentor: (id: string, transferTo?: string) => Promise<MentorOut | null>;
  reactivateMentor: (id: string) => Promise<MentorOut | null>;
}

export function useMentors(defaultLimit = 20): UseMentorsReturn {
  const { page, limit, goToPage, goToNextPage, goToPrevPage } = usePagination({
    initialLimit: defaultLimit,
  });
  const [data, setData] = useState<MentorListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchMentors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await accountService.listMentors(page, limit);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            (err as { response?: { data?: { detail?: string } }; message?: string })
              ?.response?.data?.detail ||
              (err as { message?: string })?.message ||
              "Failed to load mentors."
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchMentors();
    return () => { cancelled = true; };
  }, [page, limit, refresh]);

  const refetch = useCallback(() => setRefresh((v) => v + 1), []);

  const deactivateMentor = useCallback(
    async (id: string, transferTo?: string): Promise<MentorOut | null> => {
      try {
        const result = await accountService.deactivateMentor(id, {
          isactive: false,
          transferred_to_mentor_id: transferTo ?? null,
        });
        setRefresh((v) => v + 1);
        return result;
      } catch {
        return null;
      }
    },
    []
  );

  const reactivateMentor = useCallback(
    async (id: string): Promise<MentorOut | null> => {
      try {
        const result = await accountService.reactivateMentor(id, { isactive: true });
        setRefresh((v) => v + 1);
        return result;
      } catch {
        return null;
      }
    },
    []
  );

  return { data, isLoading, error, page, limit, goToPage, goToNextPage, goToPrevPage, refetch, deactivateMentor, reactivateMentor };
}
