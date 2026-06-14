// src/features/account_creation/types/account.types.ts
/**
 * TypeScript interfaces matching the Identity Service mentor & trainee schemas.
 * Reference: src/api/schemas/mentors_schema.py, trainees_schema.py, listing_endpoints.py
 */

// ─── Generic pagination ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Mentor ───────────────────────────────────────────────────────────────────

/** POST /admin/mentors — request body */
export interface MentorCreate {
  email: string;
  fullname: string;
  designation: string;
  departmentid: string;       // UUID string
  employeeid?: string | null;
  phone?: string | null;
  profilepictureurl?: string | null;
  isactive?: boolean;
  password: string;
}

/** Mentor response from backend */
export interface MentorOut {
  mentorid: string;           // UUID string
  email: string;
  fullname: string;
  designation: string;
  departmentid: string;
  employeeid?: string | null;
  phone?: string | null;
  profilepictureurl?: string | null;
  isactive: boolean;
  createdby: string;
  deletedat?: string | null;
  createdat: string;
  updatedat: string;
  department_name?: string | null;
  department_code?: string | null;
}

/** PATCH /admin/mentors/:id/deactivate */
export interface MentorDeactivateRequest {
  isactive: false;
  transferred_to_mentor_id?: string | null;
}

/** PATCH /admin/mentors/:id/reactivate */
export interface MentorReactivateRequest {
  isactive: true;
}

export type MentorListResponse = PaginatedResponse<MentorOut>;

// ─── Trainee ──────────────────────────────────────────────────────────────────

/** POST /admin/trainees — request body */
export interface TraineeCreate {
  email: string;
  fullname: string;
  departmentid: string;       // UUID string
  employeeid?: string | null;
  dob?: string | null;        // ISO date string e.g. "1998-05-14"
  phone?: string | null;
  profilepictureurl?: string | null;
  joiningdate?: string | null;
  isactive?: boolean;
  password: string;
}

/** Trainee response from backend */
export interface TraineeOut {
  traineeid: string;          // UUID string
  email: string;
  fullname: string;
  departmentid: string;
  employeeid?: string | null;
  dob?: string | null;
  phone?: string | null;
  profilepictureurl?: string | null;
  joiningdate?: string | null;
  isactive: boolean;
  createdby: string;
  deletedat?: string | null;
  createdat: string;
  updatedat: string;
}

/** PATCH /admin/trainees/:id/deactivate */
export interface TraineeDeactivateRequest {
  isactive: false;
}

/** PATCH /admin/trainees/:id/reactivate */
export interface TraineeReactivateRequest {
  isactive: true;
}

export type TraineeListResponse = PaginatedResponse<TraineeOut>;
