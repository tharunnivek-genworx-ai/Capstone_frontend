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
 * Resolution order (also mirrored in the frontend live-preview helper):
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
  node_specific_instruction?: string | null;
  tree_default_instruction?: string | null;
  node_additive_instruction?: string | null;
}

export interface NodeReparentRequest {
  new_parent_id?: string | null; // null → promote to root
  new_order_index?: number | null;
}

export interface NodeReorderItem {
  node_id: string;
  order_index: number;
}

export interface NodeReorderRequest {
  nodes: NodeReorderItem[];
}

export interface NodeArchiveRequest {
  archive_children: boolean;
}

// ── Response shapes ───────────────────────────────────────────────────────────

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
  is_primary_learning_unit: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  source_pdf_id: string | null;
  source_section_path: string | null;
  auto_generated: boolean;
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
  is_active: boolean;
  auto_generated: boolean;
  children: NodeTreeNode[];
}

export interface NodeTreeResponse {
  space_id: string;
  roots: NodeTreeNode[];
  total_nodes: number;
}
