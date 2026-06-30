// src/features/spaces/hooks/useTopicTree.ts
/**
 * React hook managing in-memory topic tree state.
 * Handles optimistic updates for create, rename, reparent, reorder, archive.
 */

import { useState, useCallback } from "react";
import { nodeService } from "../services/nodeService";
import type {
  NodeTreeNode,
  NodeTreeResponse,
  NodeResponse,
  NodeCreateRequest,
  NodeRenameRequest,
  NodeUpdateInstructionRequest,
  NodeReparentRequest,
  NodeArchiveRequest,
  NodeArchiveOut,
} from "../types/node.types";

// ── Tree manipulation helpers ─────────────────────────────────────────────────

/**
 * Insert a newly created node into the in-memory tree.
 */
function insertNode(roots: NodeTreeNode[], newNode: NodeResponse): NodeTreeNode[] {
  const treeNode: NodeTreeNode = {
    node_id: newNode.node_id,
    parent_id: newNode.parent_id,
    title: newNode.title,
    level: newNode.level,
    order_index: newNode.order_index,
    node_specific_instruction: newNode.node_specific_instruction,
    tree_default_instruction: newNode.tree_default_instruction,
    node_additive_instruction: newNode.node_additive_instruction,
    effective_instruction: newNode.effective_instruction,
    effective_instruction_parts: newNode.effective_instruction_parts,
    is_active: newNode.is_active,
    auto_generated: newNode.auto_generated,
    hasPublishedMaterial: newNode.hasPublishedMaterial ?? false,
    children: [],
  };

  if (!newNode.parent_id) {
    // Root node — append to roots sorted by order_index
    const updated = [...roots, treeNode].sort((a, b) => a.order_index - b.order_index);
    return updated;
  }

  return insertIntoChildren(roots, newNode.parent_id, treeNode);
}

function insertIntoChildren(
  nodes: NodeTreeNode[],
  parentId: string,
  newNode: NodeTreeNode
): NodeTreeNode[] {
  return nodes.map((n) => {
    if (n.node_id === parentId) {
      const updated = [...n.children, newNode].sort((a, b) => a.order_index - b.order_index);
      return { ...n, children: updated };
    }
    return { ...n, children: insertIntoChildren(n.children, parentId, newNode) };
  });
}

/**
 * Mark a node (and optionally its subtree) as archived.
 */
function archiveInTree(nodes: NodeTreeNode[], nodeId: string, withChildren: boolean): NodeTreeNode[] {
  return nodes
    .map((n) => {
      if (n.node_id === nodeId) {
        if (withChildren) return null; // remove entirely
        return null; // archived nodes are hidden (is_active = false)
      }
      return { ...n, children: archiveInTree(n.children, nodeId, withChildren) };
    })
    .filter((n): n is NodeTreeNode => n !== null);
}

/**
 * Reorder siblings in the tree.
 */
/**
 * Optimistically find and swap a node with its sibling in tree.
 */
function findAndSwapInTree(
  nodes: NodeTreeNode[],
  nodeId: string,
  direction: "up" | "down"
): { updated: NodeTreeNode[]; success: boolean } {
  const idx = nodes.findIndex((n) => n.node_id === nodeId);
  if (idx !== -1) {
    if (direction === "up" && idx > 0) {
      const copy = [...nodes];
      const tmp = copy[idx].order_index;
      copy[idx] = { ...copy[idx], order_index: copy[idx - 1].order_index };
      copy[idx - 1] = { ...copy[idx - 1], order_index: tmp };
      [copy[idx], copy[idx - 1]] = [copy[idx - 1], copy[idx]];
      return { updated: copy, success: true };
    }
    if (direction === "down" && idx < nodes.length - 1) {
      const copy = [...nodes];
      const tmp = copy[idx].order_index;
      copy[idx] = { ...copy[idx], order_index: copy[idx + 1].order_index };
      copy[idx + 1] = { ...copy[idx + 1], order_index: tmp };
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return { updated: copy, success: true };
    }
    return { updated: nodes, success: false };
  }

  let swapped = false;
  const updated = nodes.map((n) => {
    if (swapped) return n;
    const res = findAndSwapInTree(n.children, nodeId, direction);
    if (res.success) {
      swapped = true;
      return { ...n, children: res.updated };
    }
    return n;
  });

  return { updated, success: swapped };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseTopicTreeReturn {
  roots: NodeTreeNode[];
  totalNodes: number;
  isLoading: boolean;
  error: string | null;
  fetchTree: (spaceId: string) => Promise<void>;
  createNode: (spaceId: string, payload: NodeCreateRequest) => Promise<NodeResponse>;
  renameNode: (nodeId: string, payload: NodeRenameRequest) => Promise<NodeResponse>;
  updateNodeInstruction: (nodeId: string, payload: NodeUpdateInstructionRequest) => Promise<NodeResponse>;
  reparentNode: (spaceId: string, nodeId: string, payload: NodeReparentRequest) => Promise<void>;
  reorderNode: (spaceId: string, nodeId: string, direction: "up" | "down") => Promise<void>;
  archiveNode: (nodeId: string, payload: NodeArchiveRequest) => Promise<NodeArchiveOut>;
  clearError: () => void;
}

export const useTopicTree = (): UseTopicTreeReturn => {
  const [roots, setRoots] = useState<NodeTreeNode[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (err: unknown): string => {
    const e = err as { response?: { data?: { detail?: string } }; message?: string };
    return e?.response?.data?.detail ?? e?.message ?? "An unexpected error occurred.";
  };

  const fetchTree = useCallback(async (spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: NodeTreeResponse = await nodeService.getTree(spaceId);
      setRoots(res.roots);
      setTotalNodes(res.total_nodes);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNode = useCallback(
    async (spaceId: string, payload: NodeCreateRequest): Promise<NodeResponse> => {
      const created = await nodeService.createNode(spaceId, payload);
      setRoots((prev) => insertNode(prev, created));
      setTotalNodes((t) => t + 1);
      return created;
    },
    []
  );

  const renameNode = useCallback(
    async (nodeId: string, payload: NodeRenameRequest): Promise<NodeResponse> => {
      const updated = await nodeService.renameNode(nodeId, payload);
      const res = await nodeService.getTree(updated.space_id);
      setRoots(res.roots);
      setTotalNodes(res.total_nodes);
      return updated;
    },
    []
  );

  const updateNodeInstruction = useCallback(
    async (nodeId: string, payload: NodeUpdateInstructionRequest): Promise<NodeResponse> => {
      const updated = await nodeService.updateNodeInstruction(nodeId, payload);
      const res = await nodeService.getTree(updated.space_id);
      setRoots(res.roots);
      setTotalNodes(res.total_nodes);
      return updated;
    },
    []
  );

  const reparentNode = useCallback(
    async (spaceId: string, nodeId: string, payload: NodeReparentRequest): Promise<void> => {
      await nodeService.reparentNode(nodeId, payload);
      // Refresh the full tree after reparent to get accurate level/order
      const res = await nodeService.getTree(spaceId);
      setRoots(res.roots);
      setTotalNodes(res.total_nodes);
    },
    []
  );

  const reorderNode = useCallback(
    async (
      spaceId: string,
      nodeId: string,
      direction: "up" | "down"
    ): Promise<void> => {
      // Optimistic update
      setRoots((prev) => findAndSwapInTree(prev, nodeId, direction).updated);
      try {
        await nodeService.reorderNode(nodeId, { direction });
        const res = await nodeService.getTree(spaceId);
        setRoots(res.roots);
        setTotalNodes(res.total_nodes);
      } catch (err) {
        setError(extractError(err));
        // Re-fetch to restore consistent state
        const res = await nodeService.getTree(spaceId);
        setRoots(res.roots);
        setTotalNodes(res.total_nodes);
      }
    },
    []
  );

  const archiveNode = useCallback(
    async (nodeId: string, payload: NodeArchiveRequest): Promise<NodeArchiveOut> => {
      const result = await nodeService.archiveNode(nodeId, payload);
      setRoots((prev) => archiveInTree(prev, nodeId, payload.archive_children));
      setTotalNodes((t) => Math.max(0, t - result.archived_count));
      return result;
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    roots,
    totalNodes,
    isLoading,
    error,
    fetchTree,
    createNode,
    renameNode,
    updateNodeInstruction,
    reparentNode,
    reorderNode,
    archiveNode,
    clearError,
  };
};
