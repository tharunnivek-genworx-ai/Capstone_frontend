import { describe, expect, it } from "vitest";
import type { NodeTreeNode } from "../../spaces/types/node.types";
import type {
  BatchDetailOut,
  BatchJobOut,
  BatchStepOut,
} from "../types/studyMaterialBatch.types";
import {
  batchChildrenForNode,
  batchHubBannerCta,
  batchHubStatusLabel,
  batchStepNodeIdSet,
  findBatchStepForNode,
  isBatchHubChildOpenDisabled,
  isBatchHubEligibleNode,
  isNodeInBatchCohort,
  nodeOrDescendantInBatchCohort,
  resolveBatchHubCardStatus,
  shouldShowBatchHub,
} from "./batchHubEligibility";

function makeNode(
  overrides: Partial<NodeTreeNode> & Pick<NodeTreeNode, "node_id" | "title">
): NodeTreeNode {
  return {
    parent_id: null,
    level: 0,
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

function makeStep(
  overrides: Partial<BatchStepOut> & Pick<BatchStepOut, "node_id" | "status">
): BatchStepOut {
  return {
    step_id: `step-${overrides.node_id}`,
    batch_id: "batch-1",
    position: 0,
    node_title: overrides.node_id,
    path_titles: [],
    depth_level: 0,
    root_segment_node_id: overrides.node_id,
    generation_run_id: null,
    run_status: null,
    started_at: null,
    completed_at: null,
    ...overrides,
  };
}

function makeBatchDetail(steps: BatchStepOut[]): BatchDetailOut {
  const batch: BatchJobOut = {
    batch_id: "batch-1",
    space_id: "space-1",
    mentor_id: "mentor-1",
    status: "completed",
    policy: { mode: "skip_existing" },
    selected_root_node_ids: [],
    total_steps: steps.length,
    completed_steps: steps.filter((s) => s.status === "completed").length,
    failed_steps: steps.filter((s) => s.status === "failed").length,
    skipped_steps: steps.filter((s) => s.status === "skipped").length,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    started_at: null,
    finished_at: null,
  };
  return { batch, steps };
}

describe("batch cohort membership", () => {
  const leafA = makeNode({ node_id: "a", title: "A" });
  const leafB = makeNode({ node_id: "b", title: "B" });
  const mid = makeNode({
    node_id: "mid",
    title: "Mid",
    children: [leafA, leafB],
  });
  const root = makeNode({
    node_id: "root",
    title: "Root",
    children: [mid],
  });

  it("builds a set of step node ids", () => {
    expect(
      batchStepNodeIdSet([
        makeStep({ node_id: "a", status: "completed" }),
        makeStep({ node_id: "b", status: "pending" }),
      ])
    ).toEqual(new Set(["a", "b"]));
  });

  it("detects direct cohort membership", () => {
    const ids = new Set(["root", "a"]);
    expect(isNodeInBatchCohort("root", ids)).toBe(true);
    expect(isNodeInBatchCohort("mid", ids)).toBe(false);
  });

  it("detects descendant cohort membership for parents not in steps", () => {
    const ids = new Set(["a"]);
    expect(nodeOrDescendantInBatchCohort(leafA, ids)).toBe(true);
    expect(nodeOrDescendantInBatchCohort(mid, ids)).toBe(true);
    expect(nodeOrDescendantInBatchCohort(root, ids)).toBe(true);
    expect(nodeOrDescendantInBatchCohort(leafB, ids)).toBe(false);
  });
});

describe("isBatchHubEligibleNode / shouldShowBatchHub", () => {
  const child = makeNode({ node_id: "child", title: "Child" });
  const parent = makeNode({
    node_id: "parent",
    title: "Parent",
    children: [child],
  });
  const leaf = makeNode({ node_id: "leaf", title: "Leaf" });

  it("requires children and cohort membership (self or descendant)", () => {
    expect(
      isBatchHubEligibleNode(parent, [
        makeStep({ node_id: "parent", status: "completed" }),
      ])
    ).toBe(true);

    expect(
      isBatchHubEligibleNode(parent, [
        makeStep({ node_id: "child", status: "completed" }),
      ])
    ).toBe(true);

    expect(
      isBatchHubEligibleNode(parent, [
        makeStep({ node_id: "other", status: "completed" }),
      ])
    ).toBe(false);

    expect(
      isBatchHubEligibleNode(leaf, [
        makeStep({ node_id: "leaf", status: "completed" }),
      ])
    ).toBe(false);
  });

  it("never shows hub without batchDetail (normal generate has no cohort)", () => {
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: null,
        node: parent,
      })
    ).toBe(false);
  });

  it("shows hub when all plan gates pass", () => {
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: makeBatchDetail([
          makeStep({ node_id: "parent", status: "completed" }),
          makeStep({ node_id: "child", status: "completed" }),
        ]),
        node: parent,
      })
    ).toBe(true);
  });

  it("hides hub for trainees, non-page-2, generating, or material drill", () => {
    const batchDetail = makeBatchDetail([
      makeStep({ node_id: "parent", status: "completed" }),
    ]);
    const base = {
      isMentor: true,
      currentPage: 2,
      batchDetail,
      node: parent,
    };

    expect(shouldShowBatchHub({ ...base, isMentor: false })).toBe(false);
    expect(shouldShowBatchHub({ ...base, currentPage: 1 })).toBe(false);
    expect(
      shouldShowBatchHub({ ...base, isGeneratingOrProgressing: true })
    ).toBe(false);
    expect(shouldShowBatchHub({ ...base, isDrilledIntoMaterial: true })).toBe(
      false
    );
  });

  it("shows hub for parent-only selection (children not in steps)", () => {
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: makeBatchDetail([
          makeStep({ node_id: "parent", status: "completed" }),
        ]),
        node: parent,
      })
    ).toBe(true);
  });

  it("shows hub when only descendants are in the batch", () => {
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: makeBatchDetail([
          makeStep({ node_id: "child", status: "completed" }),
        ]),
        node: parent,
      })
    ).toBe(true);
  });
});

/**
 * Plan edge matrix (demo-verify): gates that decide hub vs material.
 * Panel wiring uses these helpers + local drill/stack; no cohort ⇒ no hub.
 */
describe("edge matrix: hub vs material (plan locked behaviors)", () => {
  const leaf = makeNode({ node_id: "leaf", title: "Leaf" });
  const childOk = makeNode({ node_id: "child-ok", title: "Child OK" });
  const childFail = makeNode({ node_id: "child-fail", title: "Child Fail" });
  const childPending = makeNode({
    node_id: "child-pending",
    title: "Child Pending",
  });
  const childSkipped = makeNode({
    node_id: "child-skipped",
    title: "Child Skipped",
  });
  const childOut = makeNode({ node_id: "child-out", title: "Sibling out" });
  const parent = makeNode({
    node_id: "parent",
    title: "Parent",
    children: [
      childOk,
      childFail,
      childPending,
      childSkipped,
      childOut,
    ],
  });

  it("normal generate parent with children: no batchDetail → no hub", () => {
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: null,
        node: parent,
      })
    ).toBe(false);
  });

  it("leaf in batch: never hub (open material path)", () => {
    expect(
      isBatchHubEligibleNode(leaf, [
        makeStep({ node_id: "leaf", status: "completed" }),
      ])
    ).toBe(false);
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: makeBatchDetail([
          makeStep({ node_id: "leaf", status: "completed" }),
        ]),
        node: leaf,
      })
    ).toBe(false);
  });

  it("parent + children in batch: hub eligible; banner CTA open draft", () => {
    const steps = [
      makeStep({ node_id: "parent", status: "completed" }),
      makeStep({ node_id: "child-ok", status: "completed" }),
    ];
    expect(isBatchHubEligibleNode(parent, steps)).toBe(true);
    expect(
      batchHubBannerCta(findBatchStepForNode(steps, "parent"))
    ).toMatchObject({ label: "Open draft ›", disabled: false });
  });

  it("partial siblings: non-step sibling labeled not_in_batch; pending disabled", () => {
    const cards = batchChildrenForNode(parent, [
      makeStep({ node_id: "parent", status: "completed" }),
      makeStep({ node_id: "child-ok", status: "completed" }),
      makeStep({ node_id: "child-fail", status: "failed" }),
      makeStep({ node_id: "child-pending", status: "pending" }),
      makeStep({ node_id: "child-skipped", status: "skipped" }),
    ]);
    const byId = Object.fromEntries(cards.map((c) => [c.node.node_id, c]));
    expect(byId["child-out"].status).toBe("not_in_batch");
    expect(batchHubStatusLabel(byId["child-out"].status)).toBe(
      "Not in this batch"
    );
    expect(isBatchHubChildOpenDisabled(byId["child-pending"].status)).toBe(
      true
    );
    expect(isBatchHubChildOpenDisabled(byId["child-fail"].status)).toBe(false);
    expect(isBatchHubChildOpenDisabled(byId["child-skipped"].status)).toBe(
      false
    );
    expect(batchHubStatusLabel(byId["child-fail"].status)).toBe("Failed");
    expect(batchHubStatusLabel(byId["child-skipped"].status)).toBe(
      "Skipped — kept existing"
    );
  });

  it("parent failed / skipped: banner CTAs; children still listed", () => {
    expect(
      batchHubBannerCta(
        makeStep({ node_id: "parent", status: "failed" })
      ).label
    ).toBe("Review failure ›");
    expect(
      batchHubBannerCta(
        makeStep({ node_id: "parent", status: "skipped" })
      ).label
    ).toBe("Open existing draft ›");
    const cards = batchChildrenForNode(parent, [
      makeStep({ node_id: "parent", status: "failed" }),
      makeStep({ node_id: "child-ok", status: "completed" }),
    ]);
    expect(cards.some((c) => c.status === "completed")).toBe(true);
  });

  it("children only (parent not in steps): hub if descendants in cohort; banner muted", () => {
    const steps = [makeStep({ node_id: "child-ok", status: "completed" })];
    expect(isBatchHubEligibleNode(parent, steps)).toBe(true);
    expect(batchHubBannerCta(findBatchStepForNode(steps, "parent"))).toEqual({
      label: "Not generated in this batch",
      disabled: true,
      muted: true,
    });
  });

  it("material drill / progress / trainee: suppress hub (no normal-gen leakage)", () => {
    const batchDetail = makeBatchDetail([
      makeStep({ node_id: "parent", status: "completed" }),
      makeStep({ node_id: "child-ok", status: "completed" }),
    ]);
    const base = {
      isMentor: true,
      currentPage: 2,
      batchDetail,
      node: parent,
    };
    expect(shouldShowBatchHub({ ...base, isDrilledIntoMaterial: true })).toBe(
      false
    );
    expect(
      shouldShowBatchHub({ ...base, isGeneratingOrProgressing: true })
    ).toBe(false);
    expect(shouldShowBatchHub({ ...base, isMentor: false })).toBe(false);
  });

  it("batch still running: hub usable for settled parent; pending child open disabled", () => {
    const steps = [
      makeStep({ node_id: "parent", status: "completed" }),
      makeStep({ node_id: "child-ok", status: "completed" }),
      makeStep({ node_id: "child-pending", status: "running" }),
    ];
    expect(
      shouldShowBatchHub({
        isMentor: true,
        currentPage: 2,
        batchDetail: makeBatchDetail(steps),
        node: parent,
      })
    ).toBe(true);
    const pending = batchChildrenForNode(parent, steps).find(
      (c) => c.node.node_id === "child-pending"
    );
    expect(pending && isBatchHubChildOpenDisabled(pending.status)).toBe(true);
  });
});

describe("status helpers", () => {
  it("maps step statuses to labels", () => {
    expect(batchHubStatusLabel("completed")).toBe("Draft ready");
    expect(batchHubStatusLabel("skipped")).toBe("Skipped — kept existing");
    expect(batchHubStatusLabel("failed")).toBe("Failed");
    expect(batchHubStatusLabel("pending")).toBe("Queued / generating");
    expect(batchHubStatusLabel("running")).toBe("Queued / generating");
    expect(batchHubStatusLabel("not_in_batch")).toBe("Not in this batch");
  });

  it("resolves card status from step or absence", () => {
    expect(resolveBatchHubCardStatus(null)).toBe("not_in_batch");
    expect(
      resolveBatchHubCardStatus(makeStep({ node_id: "x", status: "failed" }))
    ).toBe("failed");
  });

  it("builds banner CTAs for parent step outcomes", () => {
    expect(batchHubBannerCta(null)).toEqual({
      label: "Not generated in this batch",
      disabled: true,
      muted: true,
    });
    expect(
      batchHubBannerCta(makeStep({ node_id: "p", status: "completed" }))
    ).toEqual({
      label: "Open draft ›",
      disabled: false,
      muted: false,
    });
    expect(
      batchHubBannerCta(makeStep({ node_id: "p", status: "failed" }))
    ).toEqual({
      label: "Review failure ›",
      disabled: false,
      muted: false,
    });
    expect(
      batchHubBannerCta(makeStep({ node_id: "p", status: "skipped" }))
    ).toEqual({
      label: "Open existing draft ›",
      disabled: false,
      muted: false,
    });
    expect(
      batchHubBannerCta(makeStep({ node_id: "p", status: "pending" }))
    ).toMatchObject({ disabled: true });
  });

  it("disables open for pending/running children", () => {
    expect(isBatchHubChildOpenDisabled("pending")).toBe(true);
    expect(isBatchHubChildOpenDisabled("running")).toBe(true);
    expect(isBatchHubChildOpenDisabled("completed")).toBe(false);
    expect(isBatchHubChildOpenDisabled("not_in_batch")).toBe(false);
  });
});

describe("batchChildrenForNode", () => {
  it("includes all direct children with status and nested-hub flags", () => {
    const grand = makeNode({ node_id: "grand", title: "Grand" });
    const nestedParent = makeNode({
      node_id: "nested",
      title: "Nested",
      children: [grand],
    });
    const siblingOut = makeNode({ node_id: "out", title: "Out" });
    const parent = makeNode({
      node_id: "parent",
      title: "Parent",
      children: [nestedParent, siblingOut],
    });

    const cards = batchChildrenForNode(parent, [
      makeStep({ node_id: "nested", status: "completed" }),
      makeStep({ node_id: "grand", status: "completed" }),
    ]);

    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      status: "completed",
      opensNestedHub: true,
    });
    expect(cards[0].node.node_id).toBe("nested");
    expect(cards[1]).toMatchObject({
      status: "not_in_batch",
      opensNestedHub: false,
      step: null,
    });
    expect(cards[1].node.node_id).toBe("out");
  });

  it("returns empty for leaves or missing node", () => {
    expect(batchChildrenForNode(null, [])).toEqual([]);
    expect(
      batchChildrenForNode(makeNode({ node_id: "leaf", title: "Leaf" }), [
        makeStep({ node_id: "leaf", status: "completed" }),
      ])
    ).toEqual([]);
  });
});
