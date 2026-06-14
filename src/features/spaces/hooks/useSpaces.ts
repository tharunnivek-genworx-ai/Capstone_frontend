// src/features/spaces/hooks/useSpaces.ts
/**
 * React hook for space CRUD operations.
 * Wraps spaceService with loading/error state management.
 */

import { useState, useCallback } from "react";
import { spaceService } from "../services/spaceService";
import type {
  SpaceResponse,
  SpaceListResponse,
  SpaceCreateRequest,
  SpacePublishRequest,
} from "../types/space.types";

interface UseSpacesReturn {
  spaces: SpaceResponse[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchSpaces: (page?: number, limit?: number) => Promise<void>;
  createSpace: (payload: SpaceCreateRequest) => Promise<SpaceResponse>;
  publishSpace: (spaceId: string, payload: SpacePublishRequest) => Promise<SpaceResponse>;
  clearError: () => void;
}

export const useSpaces = (): UseSpacesReturn => {
  const [spaces, setSpaces] = useState<SpaceResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (err: unknown): string => {
    const e = err as { response?: { data?: { detail?: string } }; message?: string };
    return e?.response?.data?.detail ?? e?.message ?? "An unexpected error occurred.";
  };

  const fetchSpaces = useCallback(async (page = 1, limit = 50) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: SpaceListResponse = await spaceService.listSpaces(page, limit);
      setSpaces(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSpace = useCallback(async (payload: SpaceCreateRequest): Promise<SpaceResponse> => {
    const created = await spaceService.createSpace(payload);
    setSpaces((prev) => [created, ...prev]);
    setTotal((t) => t + 1);
    return created;
  }, []);

  const publishSpace = useCallback(async (spaceId: string, payload: SpacePublishRequest): Promise<SpaceResponse> => {
    const updated = await spaceService.publishSpace(spaceId, payload);
    setSpaces((prev) => prev.map((s) => (s.space_id === spaceId ? updated : s)));
    return updated;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    spaces,
    total,
    isLoading,
    error,
    fetchSpaces,
    createSpace,
    publishSpace,
    clearError,
  };
};
