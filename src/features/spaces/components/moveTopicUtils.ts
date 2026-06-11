import type { NodeTreeNode } from "../types/node.types";

export type MoveParentSelection = string | "__ROOT__" | null;

/** Collect the moving node and all descendant IDs (cannot be move targets). */
export function getExcludedMoveTargetIds(node: NodeTreeNode): Set<string> {
  const ids = new Set<string>();
  const walk = (n: NodeTreeNode) => {
    ids.add(n.node_id);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
}

export function isDescendantOf(roots: NodeTreeNode[], nodeId: string, ancestorId: string): boolean {
  const find = (nodes: NodeTreeNode[]): NodeTreeNode | null => {
    for (const n of nodes) {
      if (n.node_id === ancestorId) return n;
      const found = find(n.children);
      if (found) return found;
    }
    return null;
  };
  const ancestor = find(roots);
  if (!ancestor) return false;
  const check = (nodes: NodeTreeNode[]): boolean => {
    for (const n of nodes) {
      if (n.node_id === nodeId) return true;
      if (check(n.children)) return true;
    }
    return false;
  };
  return check(ancestor.children);
}

export function findParentId(roots: NodeTreeNode[], nodeId: string): string | null {
  const search = (nodes: NodeTreeNode[]): string | null | undefined => {
    for (const n of nodes) {
      if (n.children.some((c) => c.node_id === nodeId)) return n.node_id;
      const found = search(n.children);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  const result = search(roots);
  return result !== undefined ? result : null;
}
