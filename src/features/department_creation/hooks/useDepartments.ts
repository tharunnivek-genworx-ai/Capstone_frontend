// src/features/department_creation/hooks/useDepartments.ts
import { useState, useEffect, useCallback } from "react";
import { departmentService } from "../services/departmentService";
import type { DepartmentListResponse, DepartmentOut, DepartmentUpdate } from "../types/department.types";
import { usePagination } from "../../../hooks/usePagination";

interface UseDepartmentsReturn {
  data: DepartmentListResponse | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  goToNextPage: (totalPages: number) => void;
  goToPrevPage: () => void;
  refetch: () => void;
  updateDepartment: (id: string, payload: DepartmentUpdate) => Promise<DepartmentOut | null>;
}

export function useDepartments(defaultLimit = 20): UseDepartmentsReturn {
  const { page, limit, goToNextPage, goToPrevPage } = usePagination({
    initialLimit: defaultLimit,
  });
  const [data, setData] = useState<DepartmentListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await departmentService.listDepartments(page, limit);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            (err as { response?: { data?: { detail?: string } }; message?: string })
              ?.response?.data?.detail ||
              (err as { message?: string })?.message ||
              "Failed to load departments."
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [page, limit, refresh]);

  const refetch = useCallback(() => setRefresh((v) => v + 1), []);

  const updateDepartment = useCallback(
    async (id: string, payload: DepartmentUpdate): Promise<DepartmentOut | null> => {
      try {
        const result = await departmentService.updateDepartment(id, payload);
        setRefresh((v) => v + 1);
        return result;
      } catch {
        return null;
      }
    },
    []
  );

  return { data, isLoading, error, page, limit, goToNextPage, goToPrevPage, refetch, updateDepartment };
}
