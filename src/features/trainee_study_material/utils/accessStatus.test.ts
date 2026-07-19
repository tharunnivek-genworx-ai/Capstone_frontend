import { describe, expect, it } from "vitest";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type { SubtopicPanelItem } from "../types/traineeNodePanel.types";
import { getTreeNodeLockState, isSubtopicLocked } from "./accessStatus";

function treeNode(overrides: Partial<NodeTreeNode> = {}): NodeTreeNode {
  return {
    node_id: "node",
    parent_id: null,
    title: "Topic",
    level: 1,
    order_index: 0,
    node_specific_instruction: null,
    tree_default_instruction: null,
    node_additive_instruction: null,
    effective_instruction: null,
    effective_instruction_parts: [],
    is_active: true,
    auto_generated: false,
    children: [],
    ...overrides,
  };
}

function subtopic(access_status: SubtopicPanelItem["access_status"]): SubtopicPanelItem {
  return {
    node_id: "child",
    title: "Child",
    is_published: true,
    access_status,
    blocked_by_node_id: null,
    blocked_by_title: null,
    unlock_message: null,
    lesson_count: 1,
    child_count: 0,
    meta_label: "1 lesson",
    badge_kind: access_status === "prerequisite_locked" ? "prerequisite_locked" : "available",
    badge_label: "Not started",
  };
}

describe("trainee access status UI mapping", () => {
  it("uses prerequisite copy instead of coming soon", () => {
    const state = getTreeNodeLockState(
      treeNode({
        access_status: "prerequisite_locked",
        blocked_by_title: "Basics",
        unlock_message: "Finish Basics first",
      }),
    );
    expect(state).toEqual({ isLocked: true, label: "Finish Basics first" });
  });

  it("labels publication-only locks as coming soon", () => {
    expect(getTreeNodeLockState(treeNode({ access_status: "coming_soon" }))).toEqual({
      isLocked: true,
      label: "Coming soon",
    });
  });

  it("keeps available nodes and subtopics interactive", () => {
    expect(getTreeNodeLockState(treeNode({ access_status: "available" })).isLocked).toBe(false);
    expect(isSubtopicLocked(subtopic("available"))).toBe(false);
  });

  it("disables both prerequisite and publication-locked subtopics", () => {
    expect(isSubtopicLocked(subtopic("prerequisite_locked"))).toBe(true);
    expect(isSubtopicLocked(subtopic("coming_soon"))).toBe(true);
  });

  it("supports legacy tree payloads during rolling deployment", () => {
    const state = getTreeNodeLockState(
      treeNode({ hasPublishedMaterial: false, access_status: undefined }),
    );
    expect(state).toEqual({ isLocked: true, label: "Coming soon" });
  });
});
