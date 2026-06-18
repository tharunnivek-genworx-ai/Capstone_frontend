import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { NodePanelType } from "../types/traineeNodePanel.types";

export function getNodePanelType(node: NodeTreeNode): NodePanelType {
  const hasStudyMaterial = node.hasPublishedMaterial === true;
  const childCount = node.children.length;

  if (childCount > 0) {
    return hasStudyMaterial ? "mixed-parent" : "pure-parent";
  }
  return hasStudyMaterial ? "leaf-available" : "leaf-locked";
}

export function findTreeNode(
  roots: NodeTreeNode[],
  nodeId: string
): NodeTreeNode | null {
  for (const root of roots) {
    if (root.node_id === nodeId) return root;
    const found = findTreeNode(root.children, nodeId);
    if (found) return found;
  }
  return null;
}

export function getAncestorChain(
  roots: NodeTreeNode[],
  nodeId: string
): NodeTreeNode[] {
  const chain: NodeTreeNode[] = [];

  function walk(nodes: NodeTreeNode[], ancestors: NodeTreeNode[]): boolean {
    for (const node of nodes) {
      if (node.node_id === nodeId) {
        chain.push(...ancestors, node);
        return true;
      }
      if (walk(node.children, [...ancestors, node])) return true;
    }
    return false;
  }

  walk(roots, []);
  return chain;
}
