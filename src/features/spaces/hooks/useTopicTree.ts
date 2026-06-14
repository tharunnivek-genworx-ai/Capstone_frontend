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
  NodeReorderRequest,
  NodeArchiveRequest,
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
function reorderInTree(
  nodes: NodeTreeNode[],
  parentId: string | null,
  reorderedItems: Array<{ node_id: string; order_index: number }>
): NodeTreeNode[] {
  if (parentId === null) {
    // Reordering root nodes
    return nodes.map((n) => {
      const item = reorderedItems.find((r) => r.node_id === n.node_id);
      return item ? { ...n, order_index: item.order_index } : n;
    }).sort((a, b) => a.order_index - b.order_index);
  }

  return nodes.map((n) => {
    if (n.node_id === parentId) {
      const updatedChildren = n.children.map((c) => {
        const item = reorderedItems.find((r) => r.node_id === c.node_id);
        return item ? { ...c, order_index: item.order_index } : c;
      }).sort((a, b) => a.order_index - b.order_index);
      return { ...n, children: updatedChildren };
    }
    return { ...n, children: reorderInTree(n.children, parentId, reorderedItems) };
  });
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
  reorderNodes: (spaceId: string, parentId: string | null, reorderedItems: Array<{ node_id: string; order_index: number }>) => Promise<void>;
  archiveNode: (nodeId: string, payload: NodeArchiveRequest) => Promise<void>;
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

  const reorderNodes = useCallback(
    async (
      spaceId: string,
      parentId: string | null,
      reorderedItems: Array<{ node_id: string; order_index: number }>
    ): Promise<void> => {
      // Optimistic update
      setRoots((prev) => reorderInTree(prev, parentId, reorderedItems));
      const req: NodeReorderRequest = {
        nodes: reorderedItems.map((r) => ({ node_id: r.node_id, order_index: r.order_index })),
      };
      try {
        await nodeService.reorderNodes(spaceId, req);
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
    async (nodeId: string, payload: NodeArchiveRequest): Promise<void> => {
      await nodeService.archiveNode(nodeId, payload);
      setRoots((prev) => archiveInTree(prev, nodeId, payload.archive_children));
      setTotalNodes((t) => Math.max(0, t - 1)); // conservative estimate
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
    reorderNodes,
    archiveNode,
    clearError,
  };
};
