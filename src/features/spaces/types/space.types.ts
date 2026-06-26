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
  is_transferred_away: boolean;
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

export interface AdminMentorSpaceOut extends SpaceResponse {
  needs_ownership_transfer: boolean;
}

export interface AdminMentorTransferredSpaceIn extends AdminMentorSpaceOut {
  original_mentor_id: string;
  original_mentor_name: string;
}

export interface AdminMentorSpaceOverviewResponse {
  owned_spaces: AdminMentorSpaceOut[];
  transferred_in_spaces: AdminMentorTransferredSpaceIn[];
  has_pending_transfers: boolean;
}

export interface AdminMentorSpaceListResponse {
  items: AdminMentorSpaceOut[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SpaceUnpublishPreviewOut {
  published_material_count: number;
  published_quiz_count: number;
}

export interface RepublishChecklistNode {
  node_id: string;
  node_title: string;
  last_published_version_id: string | null;
  last_published_version_label: string | null;
  has_unpublished_quiz: boolean;
  quiz_id: string | null;
  quiz_title: string | null;
}

export interface SpaceRepublishChecklistOut {
  space_id: string;
  nodes_with_publishable_material: RepublishChecklistNode[];
}

export interface SpaceJoinResponse {
  space_id: string;
  space_name: string;
  joined_via: string;
  joined_at: string;
}
