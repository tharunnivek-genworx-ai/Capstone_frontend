// src/features/department_creation/hooks/useCreateDepartment.ts
import { useState, useCallback } from "react";
import { departmentService } from "../services/departmentService";
import type { DepartmentCreate, DepartmentOut } from "../types/department.types";

interface UseCreateDepartmentReturn {
  isLoading: boolean;
  error: string | null;
  createDepartment: (payload: DepartmentCreate) => Promise<DepartmentOut | null>;
  clearError: () => void;
}

export function useCreateDepartment(): UseCreateDepartmentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDepartment = useCallback(
    async (payload: DepartmentCreate): Promise<DepartmentOut | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await departmentService.createDepartment(payload);
        return result;
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ||
          (err as { message?: string })?.message ||
          "Failed to create department.";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { isLoading, error, createDepartment, clearError };
}
