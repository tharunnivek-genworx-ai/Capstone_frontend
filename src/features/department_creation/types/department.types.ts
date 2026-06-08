// src/features/department_creation/types/department.types.ts
/**
 * TypeScript interfaces matching the Identity Service department schemas.
 * Reference: src/api/schemas/departments_schema.py
 */

import type { PaginatedResponse } from "../../account_creation/types/account.types";

/** POST /admin/departments — request body */
export interface DepartmentCreate {
  departmentname: string;
  departmentcode: string;
  description?: string | null;
  isactive?: boolean;
}

/** PATCH /admin/departments/:id — request body (all optional) */
export interface DepartmentUpdate {
  departmentname?: string | null;
  description?: string | null;
  isactive?: boolean | null;
}

/** Department response from backend */
export interface DepartmentOut {
  departmentid: string;       // UUID string
  departmentname: string;
  departmentcode: string;
  description?: string | null;
  isactive: boolean;
  createdby: string;
  createdat: string;
  updatedat: string;
}

export type DepartmentListResponse = PaginatedResponse<DepartmentOut>;
