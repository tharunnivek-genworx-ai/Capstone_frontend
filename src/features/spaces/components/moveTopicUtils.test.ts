import { describe, expect, it } from "vitest";
import type { NodeTreeNode } from "../types/node.types";
import { findParentId, getExcludedMoveTargetIds } from "./moveTopicUtils";

function topic(
  nodeId: string,
  children: NodeTreeNode[] = [],
  parentId: string | null = null,
): NodeTreeNode {
  return {
    node_id: nodeId,
    parent_id: parentId,
    title: nodeId,
    level: parentId ? 2 : 1,
    order_index: 0,
    node_specific_instruction: null,
    tree_default_instruction: null,
    node_additive_instruction: null,
    effective_instruction: null,
    effective_instruction_parts: [],
    is_active: true,
    auto_generated: false,
    children,
  };
}

describe("topic move utilities", () => {
  const grandchild = topic("grandchild", [], "child");
  const child = topic("child", [grandchild], "root");
  const root = topic("root", [child]);
  const siblingRoot = topic("sibling-root");
  const roots = [root, siblingRoot];

  it("excludes the moving topic and every descendant as move destinations", () => {
    expect([...getExcludedMoveTargetIds(root)]).toEqual(["root", "child", "grandchild"]);
  });

  it("finds immediate parents at any tree depth", () => {
    expect(findParentId(roots, "child")).toBe("root");
    expect(findParentId(roots, "grandchild")).toBe("child");
  });

  it("treats root and unknown topics as having no parent", () => {
    expect(findParentId(roots, "root")).toBeNull();
    expect(findParentId(roots, "missing")).toBeNull();
  });
});
