import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { SubtopicPanelItem } from "../types/traineeNodePanel.types";

export function isSubtopicLocked(subtopic: SubtopicPanelItem): boolean {
  return subtopic.access_status !== "available";
}

export function getTreeNodeLockState(node: NodeTreeNode): {
  isLocked: boolean;
  label: string | null;
} {
  if (node.access_status === "prerequisite_locked") {
    // Keep the tree-row chip short so the topic title stays readable;
    // full unlock copy belongs in the tooltip / detail panel.
    return { isLocked: true, label: "Locked" };
  }
  const legacyComingSoon =
    node.access_status == null &&
    node.children.length === 0 &&
    node.hasPublishedMaterial === false;
  if (node.access_status === "coming_soon" || legacyComingSoon) {
    return { isLocked: true, label: "Coming soon" };
  }
  return { isLocked: false, label: null };
}
