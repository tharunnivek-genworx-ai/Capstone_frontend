import React, { useMemo } from "react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";
import type { BatchDetailOut, BatchStepOut } from "../../types/studyMaterialBatch.types";
import {
  batchChildrenForNode,
  batchHubBannerCta,
  batchHubStatusLabel,
  findBatchStepForNode,
  isBatchHubChildOpenDisabled,
  type BatchHubCardStatus,
  type BatchHubChildCard,
} from "../../utils/batchHubEligibility";
import "../../styles/studyMaterialMentor.css";

export interface BatchParentHubProps {
  node: NodeTreeNode;
  batchDetail: BatchDetailOut;
  /** Nested hub stack: show “← Back to parent section”. */
  canNavigateToParentHub?: boolean;
  onBackToParentHub?: () => void;
  /** Banner → drill into this parent’s Improve/Regenerate material. */
  onOpenParentMaterial: () => void;
  /**
   * Subtopic CTA. Parent wiring pushes hub stack when `opensNestedHub`,
   * otherwise navigates to the child’s material.
   */
  onOpenChild: (child: NodeTreeNode, opensNestedHub: boolean) => void;
  /** Clears session cohort (“Done with batch navigation”). */
  onDismissBatchHub: () => void;
}

function formatBatchWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: BatchHubCardStatus): string {
  switch (status) {
    case "completed":
      return "batch-parent-hub__badge--draft";
    case "skipped":
      return "batch-parent-hub__badge--skipped";
    case "failed":
      return "batch-parent-hub__badge--failed";
    case "pending":
    case "running":
      return "batch-parent-hub__badge--pending";
    case "not_in_batch":
    default:
      return "batch-parent-hub__badge--not-in-batch";
  }
}

function bannerDescription(
  step: BatchStepOut | null,
  muted: boolean,
  inBatchChildCount: number
): string {
  if (step?.status === "failed") {
    return "Generation failed for this topic — open to resume or review the run.";
  }
  if (step?.status === "skipped") {
    return "Existing draft kept (skip policy). Open to review it.";
  }
  if (step?.status === "pending" || step?.status === "running") {
    return "This topic is still generating in the batch.";
  }
  if (muted || !step) {
    return "This parent was not generated in this batch.";
  }
  const noun = inBatchChildCount === 1 ? "subtopic" : "subtopics";
  return `${inBatchChildCount} ${noun} in this batch — open this topic’s own study material.`;
}

function childSummary(card: BatchHubChildCard, steps: BatchDetailOut["steps"]): string {
  const { status, opensNestedHub, node: child } = card;
  if (status === "not_in_batch") {
    return "Not included in this generate-all run.";
  }
  if (status === "failed") {
    return card.step?.error_message?.trim() || "Generation failed — open to resume.";
  }
  if (status === "pending" || status === "running") {
    return "Still queued in this batch.";
  }
  if (status === "skipped") {
    return "Existing draft kept for this subtopic.";
  }
  if (opensNestedHub) {
    const nestedInBatch = batchChildrenForNode(child, steps).filter(
      (c) => c.status !== "not_in_batch"
    ).length;
    const noun = nestedInBatch === 1 ? "subtopic" : "subtopics";
    return `${nestedInBatch} ${noun} in this batch.`;
  }
  return "Study material ready for review.";
}

const BatchParentHub: React.FC<BatchParentHubProps> = ({
  node,
  batchDetail,
  canNavigateToParentHub = false,
  onBackToParentHub,
  onOpenParentMaterial,
  onOpenChild,
  onDismissBatchHub,
}) => {
  const { batch, steps } = batchDetail;

  const parentStep = useMemo(
    () => findBatchStepForNode(steps, node.node_id),
    [steps, node.node_id]
  );
  const bannerCta = useMemo(() => batchHubBannerCta(parentStep), [parentStep]);
  const cards = useMemo(() => batchChildrenForNode(node, steps), [node, steps]);

  const inBatchChildCount = useMemo(
    () => cards.filter((c) => c.status !== "not_in_batch").length,
    [cards]
  );

  const whenLabel =
    formatBatchWhen(batch.finished_at) ?? formatBatchWhen(batch.created_at);
  const subtitle = whenLabel
    ? `Part of the same batch run · ${whenLabel}`
    : "Part of the same batch run";

  const bannerInteractive = !bannerCta.disabled && !bannerCta.muted;

  const handleBannerActivate = () => {
    if (!bannerInteractive) return;
    onOpenParentMaterial();
  };

  const handleBannerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!bannerInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenParentMaterial();
    }
  };

  return (
    <div className="batch-parent-hub" data-testid="batch-parent-hub">
      <div className="batch-parent-hub__toolbar">
        {canNavigateToParentHub && onBackToParentHub ? (
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--outline batch-parent-hub__back"
            onClick={onBackToParentHub}
          >
            ← Back to parent section
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="batch-parent-hub__dismiss"
          onClick={onDismissBatchHub}
        >
          Done with batch navigation
        </button>
      </div>

      <header className="batch-parent-hub__header">
        <h1 className="batch-parent-hub__title">{node.title} — subtopics</h1>
        <p className="batch-parent-hub__subtitle">{subtitle}</p>
      </header>

      <div
        className={`batch-parent-hub__banner${
          bannerCta.muted ? " batch-parent-hub__banner--muted" : ""
        }${bannerInteractive ? " batch-parent-hub__banner--interactive" : ""}`}
        role={bannerInteractive ? "button" : "status"}
        tabIndex={bannerInteractive ? 0 : undefined}
        aria-disabled={!bannerInteractive}
        aria-label={
          bannerInteractive
            ? `Open study material for ${node.title}`
            : `This topic: ${node.title}`
        }
        onClick={handleBannerActivate}
        onKeyDown={handleBannerKeyDown}
      >
        <div className="batch-parent-hub__banner-main">
          <div className="batch-parent-hub__eyebrow">This topic</div>
          <h2 className="batch-parent-hub__banner-title">{node.title}</h2>
          <p className="batch-parent-hub__banner-copy">
            {bannerDescription(parentStep, bannerCta.muted, inBatchChildCount)}
          </p>
        </div>
        <span
          className={`batch-parent-hub__banner-cta${
            bannerCta.disabled || bannerCta.muted
              ? " batch-parent-hub__banner-cta--disabled"
              : ""
          }`}
        >
          {bannerCta.label}
        </span>
      </div>

      <div className="batch-parent-hub__section-label">Subtopics</div>

      {cards.length === 0 ? (
        <div className="batch-parent-hub__empty">No child topics under this node.</div>
      ) : (
        <ul className="batch-parent-hub__cards">
          {cards.map((card) => {
            const openDisabled = isBatchHubChildOpenDisabled(card.status);
            const openLabel = card.opensNestedHub ? "Open section ›" : "Open material ›";
            return (
              <li key={card.node.node_id} className="batch-parent-hub__card">
                <div className="batch-parent-hub__card-body">
                  <span
                    className={`batch-parent-hub__badge ${statusBadgeClass(card.status)}`}
                  >
                    {batchHubStatusLabel(card.status)}
                  </span>
                  <h3 className="batch-parent-hub__card-title">{card.node.title}</h3>
                  <p className="batch-parent-hub__card-copy">
                    {childSummary(card, steps)}
                  </p>
                </div>
                <button
                  type="button"
                  className="batch-parent-hub__open-link"
                  disabled={openDisabled}
                  onClick={() => onOpenChild(card.node, card.opensNestedHub)}
                >
                  {openLabel}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BatchParentHub;
