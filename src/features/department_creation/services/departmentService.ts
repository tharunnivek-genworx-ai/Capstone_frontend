// src/features/department_creation/services/departmentService.ts
/**
 * Department API service — all calls against /admin/departments endpoints.
 * Requires itadmin JWT, automatically attached via axiosClient interceptor.
 */

import axiosClient from "../../../lib/axiosClient";
import type {
  DepartmentCreate,
  DepartmentOut,
  DepartmentUpdate,
  DepartmentListResponse,
} from "../types/department.types";

export const departmentService = {
  /**
   * POST /admin/departments
   * Creates a new department. departmentcode must be unique.
   */
  async createDepartment(payload: DepartmentCreate): Promise<DepartmentOut> {
    const response = await axiosClient.post<DepartmentOut>("/admin/departments", payload);
    return response.data;
  },

  /**
   * GET /admin/departments?page=1&limit=20
   * Lists all departments with pagination.
   */
  async listDepartments(page = 1, limit = 20): Promise<DepartmentListResponse> {
    const response = await axiosClient.get<DepartmentListResponse>(
      "/admin/departments",
      { params: { page, limit } }
    );
    return response.data;
  },

  /**
   * GET /admin/departments/:id
   * Fetches a single department by UUID.
   */
  async getDepartment(departmentId: string): Promise<DepartmentOut> {
    const response = await axiosClient.get<DepartmentOut>(
      `/admin/departments/${departmentId}`
    );
    return response.data;
  },

  /**
   * PATCH /admin/departments/:id
   * Partially updates a department. departmentcode is NOT updatable.
   */
  async updateDepartment(
    departmentId: string,
    payload: DepartmentUpdate
  ): Promise<DepartmentOut> {
    const response = await axiosClient.patch<DepartmentOut>(
      `/admin/departments/${departmentId}`,
      payload
    );
    return response.data;
  },
};
