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
