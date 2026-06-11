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
  SpaceUpdateRequest,
  SpacePublishRequest,
  SpaceTransferOwnershipRequest,
  SpaceAddTraineesRequest,
} from "../types/space.types";

interface UseSpacesReturn {
  spaces: SpaceResponse[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchSpaces: (page?: number, limit?: number) => Promise<void>;
  createSpace: (payload: SpaceCreateRequest) => Promise<SpaceResponse>;
  getSpace: (spaceId: string) => Promise<SpaceResponse>;
  updateSpace: (spaceId: string, payload: SpaceUpdateRequest) => Promise<SpaceResponse>;
  publishSpace: (spaceId: string, payload: SpacePublishRequest) => Promise<SpaceResponse>;
  transferOwnership: (spaceId: string, payload: SpaceTransferOwnershipRequest) => Promise<SpaceResponse>;
  addTrainees: (spaceId: string, payload: SpaceAddTraineesRequest) => Promise<void>;
  removeTrainee: (spaceId: string, traineeId: string) => Promise<void>;
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

  const getSpace = useCallback(async (spaceId: string): Promise<SpaceResponse> => {
    return spaceService.getSpace(spaceId);
  }, []);

  const updateSpace = useCallback(async (spaceId: string, payload: SpaceUpdateRequest): Promise<SpaceResponse> => {
    const updated = await spaceService.updateSpace(spaceId, payload);
    setSpaces((prev) => prev.map((s) => (s.space_id === spaceId ? updated : s)));
    return updated;
  }, []);

  const publishSpace = useCallback(async (spaceId: string, payload: SpacePublishRequest): Promise<SpaceResponse> => {
    const updated = await spaceService.publishSpace(spaceId, payload);
    setSpaces((prev) => prev.map((s) => (s.space_id === spaceId ? updated : s)));
    return updated;
  }, []);

  const transferOwnership = useCallback(async (spaceId: string, payload: SpaceTransferOwnershipRequest): Promise<SpaceResponse> => {
    const updated = await spaceService.transferOwnership(spaceId, payload);
    setSpaces((prev) => prev.map((s) => (s.space_id === spaceId ? updated : s)));
    return updated;
  }, []);

  const addTrainees = useCallback(async (spaceId: string, payload: SpaceAddTraineesRequest): Promise<void> => {
    await spaceService.addTrainees(spaceId, payload);
  }, []);

  const removeTrainee = useCallback(async (spaceId: string, traineeId: string): Promise<void> => {
    await spaceService.removeTrainee(spaceId, { trainee_id: traineeId });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    spaces,
    total,
    isLoading,
    error,
    fetchSpaces,
    createSpace,
    getSpace,
    updateSpace,
    publishSpace,
    transferOwnership,
    addTrainees,
    removeTrainee,
    clearError,
  };
};
