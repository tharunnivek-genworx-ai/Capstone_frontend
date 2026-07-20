import type { NodeTreeNode } from "../../spaces/types/node.types";
import type {
  BatchDetailOut,
  BatchStepOut,
  BatchStepStatus,
} from "../types/studyMaterialBatch.types";

/** Card / banner status derived from a batch step (or absence of one). */
export type BatchHubCardStatus =
  | "completed"
  | "skipped"
  | "failed"
  | "pending"
  | "running"
  | "not_in_batch";

export interface BatchHubChildCard {
  node: NodeTreeNode;
  step: BatchStepOut | null;
  status: BatchHubCardStatus;
  /** True when this child itself should open as a nested hub. */
  opensNestedHub: boolean;
}

export interface ShouldShowBatchHubParams {
  /** Mentor-only feature; trainees never see the hub. */
  isMentor: boolean;
  /** Hub replaces Material page-2 body only. */
  currentPage: number;
  /** Active or session-restored batch detail. */
  batchDetail: BatchDetailOut | null | undefined;
  /** Selected tree node. */
  node: Pick<NodeTreeNode, "node_id" | "children"> | null | undefined;
  /**
   * True while GenerationProgressPanel (or equivalent) owns the surface for this node.
   * Progress always wins over the hub.
   */
  isGeneratingOrProgressing?: boolean;
  /**
   * Local UI mode: when the mentor drilled into this parent's material from the hub banner,
   * keep the Improve/Regenerate workspace instead of the hub.
   */
  isDrilledIntoMaterial?: boolean;
}

export interface BatchHubBannerCta {
  label: string;
  disabled: boolean;
  /** Parent was not generated in this batch — muted banner, no fake Open draft. */
  muted: boolean;
}

/** Build a Set of node ids that appear as steps in the cohort. */
export function batchStepNodeIdSet(
  steps: readonly BatchStepOut[] | null | undefined
): Set<string> {
  const ids = new Set<string>();
  if (!steps) return ids;
  for (const step of steps) {
    if (step?.node_id) ids.add(step.node_id);
  }
  return ids;
}

export function findBatchStepForNode(
  steps: readonly BatchStepOut[] | null | undefined,
  nodeId: string
): BatchStepOut | null {
  if (!steps || !nodeId) return null;
  return steps.find((step) => step.node_id === nodeId) ?? null;
}

export function mapStepStatusToHubCardStatus(
  status: BatchStepStatus | null | undefined
): BatchHubCardStatus {
  switch (status) {
    case "completed":
      return "completed";
    case "skipped":
      return "skipped";
    case "failed":
      return "failed";
    case "running":
      return "running";
    case "pending":
      return "pending";
    default:
      return "not_in_batch";
  }
}

export function resolveBatchHubCardStatus(
  step: BatchStepOut | null | undefined
): BatchHubCardStatus {
  if (!step) return "not_in_batch";
  return mapStepStatusToHubCardStatus(step.status);
}

/** Human-readable status for subtopic cards (Material View tokens; copy from plan/mockup). */
export function batchHubStatusLabel(status: BatchHubCardStatus): string {
  switch (status) {
    case "completed":
      return "Draft ready";
    case "skipped":
      return "Skipped — kept existing";
    case "failed":
      return "Failed";
    case "running":
    case "pending":
      return "Queued / generating";
    case "not_in_batch":
    default:
      return "Not in this batch";
  }
}

/**
 * Banner CTA for the selected parent. Only enables open when the parent has its own step
 * that is not still pending/running.
 */
export function batchHubBannerCta(
  step: BatchStepOut | null | undefined
): BatchHubBannerCta {
  if (!step) {
    return {
      label: "Not generated in this batch",
      disabled: true,
      muted: true,
    };
  }

  switch (step.status) {
    case "failed":
      return { label: "Review failure ›", disabled: false, muted: false };
    case "skipped":
      return { label: "Open existing draft ›", disabled: false, muted: false };
    case "completed":
      return { label: "Open draft ›", disabled: false, muted: false };
    case "pending":
    case "running":
      return { label: "Generating… ›", disabled: true, muted: false };
    default:
      return {
        label: "Not generated in this batch",
        disabled: true,
        muted: true,
      };
  }
}

/** True if this node id appears in the batch step list. */
export function isNodeInBatchCohort(
  nodeId: string,
  stepNodeIds: ReadonlySet<string>
): boolean {
  return Boolean(nodeId) && stepNodeIds.has(nodeId);
}

/**
 * True if the node itself or any descendant appears in the cohort steps.
 * Used for mid-level parents whose children (not the parent) were selected.
 */
export function nodeOrDescendantInBatchCohort(
  node: Pick<NodeTreeNode, "node_id" | "children">,
  stepNodeIds: ReadonlySet<string>
): boolean {
  if (isNodeInBatchCohort(node.node_id, stepNodeIds)) return true;
  for (const child of node.children ?? []) {
    if (nodeOrDescendantInBatchCohort(child, stepNodeIds)) return true;
  }
  return false;
}

/**
 * Core hub eligibility (without page/mode/progress). Prefer {@link shouldShowBatchHub}
 * at call sites so all plan gates stay aligned.
 */
export function isBatchHubEligibleNode(
  node: Pick<NodeTreeNode, "node_id" | "children"> | null | undefined,
  steps: readonly BatchStepOut[] | null | undefined
): boolean {
  if (!node || !steps?.length) return false;
  if (!node.children || node.children.length === 0) return false;
  const stepNodeIds = batchStepNodeIdSet(steps);
  return nodeOrDescendantInBatchCohort(node, stepNodeIds);
}

/**
 * Show the Batch Parent Hub only when every plan gate is satisfied.
 * Never infer hub from “has children + has draft” alone.
 */
export function shouldShowBatchHub(params: ShouldShowBatchHubParams): boolean {
  const {
    isMentor,
    currentPage,
    batchDetail,
    node,
    isGeneratingOrProgressing = false,
    isDrilledIntoMaterial = false,
  } = params;

  if (!isMentor) return false;
  if (currentPage !== 2) return false;
  if (!batchDetail) return false;
  if (isGeneratingOrProgressing) return false;
  if (isDrilledIntoMaterial) return false;

  return isBatchHubEligibleNode(node, batchDetail.steps);
}

/**
 * Direct children for hub cards, with step status and whether opening should nest another hub.
 * Includes siblings not in the batch (labeled “Not in this batch”).
 */
export function batchChildrenForNode(
  node: Pick<NodeTreeNode, "children"> | null | undefined,
  steps: readonly BatchStepOut[] | null | undefined
): BatchHubChildCard[] {
  if (!node?.children?.length) return [];
  const stepList = steps ?? [];
  const stepNodeIds = batchStepNodeIdSet(stepList);

  return node.children.map((child) => {
    const step = findBatchStepForNode(stepList, child.node_id);
    const status = resolveBatchHubCardStatus(step);
    // Nested hub only when the child has kids and (child or a descendant) is in the cohort.
    const opensNestedHub =
      (child.children?.length ?? 0) > 0 &&
      nodeOrDescendantInBatchCohort(child, stepNodeIds);
    return { node: child, step, status, opensNestedHub };
  });
}

/** Whether a subtopic card CTA should be disabled (still queued / generating). */
export function isBatchHubChildOpenDisabled(status: BatchHubCardStatus): boolean {
  return status === "pending" || status === "running";
}
