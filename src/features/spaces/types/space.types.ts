// src/features/spaces/types/space.types.ts
/**
 * TypeScript interfaces matching Identity Service space_schema.py exactly.
 * Reference: src/api/schemas/space_node_schemas/space_schema.py
 */

// ── Request shapes ────────────────────────────────────────────────────────────

export interface SpaceCreateRequest {
  space_name: string;
  description?: string | null;
  department_id: string; // UUID string
}

export interface SpaceUpdateRequest {
  space_name?: string | null;
  description?: string | null;
}

export interface SpacePublishRequest {
  is_published: boolean;
}

export interface SpaceTransferOwnershipRequest {
  transferred_to_mentor_id: string; // UUID string
}

export interface SpaceAddTraineesRequest {
  trainee_ids: string[]; // UUID strings
}

export interface SpaceRemoveTraineeRequest {
  trainee_id: string; // UUID string
}

export interface SpaceJoinRequest {
  invite_code: string;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface SpaceResponse {
  space_id: string;
  space_name: string;
  description: string | null;
  department_id: string;
  mentor_id: string;
  transferred_to_mentor_id: string | null;
  effective_mentor_id: string;
  invite_code: string | null;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface SpaceMemberSummary {
  trainee_id: string;
  full_name: string;
  email: string;
  joined_via: string;
  joined_at: string;
  is_active: boolean;
}

export interface SpaceListResponse {
  items: SpaceResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SpaceJoinResponse {
  space_id: string;
  space_name: string;
  joined_via: string;
  joined_at: string;
}
