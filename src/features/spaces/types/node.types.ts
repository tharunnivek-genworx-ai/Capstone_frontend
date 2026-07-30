// src/features/spaces/types/node.types.ts
/**
 * TypeScript interfaces matching Identity Service node_schema.py exactly.
 * Reference: src/api/schemas/space_node_schemas/node_schema.py
 *
 * Instruction fields — three independent DB columns resolved by the backend:
 *   node_specific_instruction  – full override for this node only
 *   tree_default_instruction   – default inherited by all descendants
 *   node_additive_instruction  – additive extra for this node only; NOT inherited
 *
 * Resolution order:
 *   1. node_specific_instruction set → use only it
 *   2. else: inherited tree_default_instruction chain + this node's node_additive_instruction
 */

// ── Request shapes ────────────────────────────────────────────────────────────

export interface NodeCreateRequest {
  title: string;
  parent_id?: string | null; // null → root node
  order_index?: number | null;
  node_specific_instruction?: string | null;
  tree_default_instruction?: string | null;
  node_additive_instruction?: string | null;
}

export interface NodeRenameRequest {
  title: string;
}

/**
 * Partial-update semantics (PATCH /nodes/:id/instruction):
 *   field omitted → existing DB value preserved
 *   field = null  → DB value cleared
 *   field = str   → DB value written
 */
export interface NodeUpdateInstructionRequest {
  instruction_mode?: "inherit" | "extend" | "replace";
  instruction_text?: string | null;
  branch_default_instruction?: string | null;
  node_specific_instruction?: string | null;
  tree_default_instruction?: string | null;
  node_additive_instruction?: string | null;
}

export interface NodeReparentRequest {
  new_parent_id?: string | null; // null → promote to root
  new_order_index?: number | null;
}

export interface NodeReorderRequest {
  direction: "up" | "down";
}

export interface NodeArchiveRequest {
  archive_children: boolean;
}

export interface NodeArchiveOut {
  detail: string;
  archived_count: number;
  archived_node_ids: string[];
}

// ── Response shapes ───────────────────────────────────────────────────────────

export type EffectiveInstructionPartType = "inherited" | "branch-default" | "extra" | "override";

export interface EffectiveInstructionPart {
  source_node_id: string;
  source_node_title: string;
  text: string;
  type: EffectiveInstructionPartType;
  label: string;
}

export interface NodeResponse {
  node_id: string;
  space_id: string;
  parent_id: string | null;
  title: string;
  level: number;
  order_index: number;
  node_specific_instruction: string | null;
  tree_default_instruction: string | null;
  node_additive_instruction: string | null;
  /** Computed by Identity from DB columns; prefer over column inference when present. */
  instruction_mode?: "inherit" | "extend" | "replace";
  effective_instruction: string | null;
  effective_instruction_parts: EffectiveInstructionPart[];
  is_primary_learning_unit: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  source_pdf_id: string | null;
  source_section_path: string | null;
  auto_generated: boolean;
  hasPublishedMaterial?: boolean;
}

/**
 * Recursive node shape from GET /spaces/{space_id}/tree
 * children sorted by order_index.
 */
export interface NodeTreeNode {
  node_id: string;
  parent_id: string | null;
  title: string;
  level: number;
  order_index: number;
  node_specific_instruction: string | null;
  tree_default_instruction: string | null;
  node_additive_instruction: string | null;
  /** Computed by Identity from DB columns; prefer over column inference when present. */
  instruction_mode?: "inherit" | "extend" | "replace";
  effective_instruction: string | null;
  effective_instruction_parts: EffectiveInstructionPart[];
  is_active: boolean;
  auto_generated: boolean;
  hasPublishedMaterial?: boolean;
  access_status?: "coming_soon" | "prerequisite_locked" | "available";
  blocked_by_node_id?: string | null;
  blocked_by_title?: string | null;
  unlock_message?: string | null;
  children: NodeTreeNode[];
}

export interface NodeTreeResponse {
  space_id: string;
  roots: NodeTreeNode[];
  total_nodes: number;
}

// ── UI-level types ────────────────────────────────────────────────────────────

/** Which page is active in the node detail panel: 1=Teaching, 2=Study Material, 3=Quiz, 4=Hints */
export type TopicContentPage = 1 | 2 | 3 | 4;
