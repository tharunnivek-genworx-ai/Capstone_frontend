// src/features/spaces/components/MoveTopicOverlay.tsx

import React from "react";
import { Check, CornerDownRight, Layers3, X } from "lucide-react";
import type { NodeTreeNode } from "../types/node.types";
import type { MoveParentSelection } from "./moveTopicUtils";

interface MoveTopicOverlayProps {
  movingNode: NodeTreeNode;
  selectedParentId: MoveParentSelection;
  onSelectIndividualSpace: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const MoveTopicOverlay: React.FC<MoveTopicOverlayProps> = ({
  movingNode,
  selectedParentId,
  onSelectIndividualSpace,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  const isIndividualSpace = selectedParentId === "__ROOT__";
  const hasDestination = selectedParentId !== null;
  const isTopicDestination = hasDestination && selectedParentId !== "__ROOT__";

  return (
    <div className="topic-move">
      <div>
        <span className="topic-move__eyebrow">Choose destination</span>
        <h2 className="topic-move__title">Move topic</h2>
        <p className="topic-move__description">
          Select a topic below to place <strong>&ldquo;{movingNode.title}&rdquo;</strong> inside it.
        </p>
      </div>

      <button
        type="button"
        onClick={onSelectIndividualSpace}
        className={`topic-move__root-option${isIndividualSpace ? " topic-move__root-option--selected" : ""}`}
        disabled={isSubmitting}
      >
        <Layers3 size={17} />
        <span>Make this a separate section</span>
        {isIndividualSpace && <Check size={16} className="topic-move__check" />}
      </button>

      <div className="topic-move__actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          <X size={15} />
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn-primary"
          disabled={isSubmitting || !hasDestination}
        >
          {isSubmitting ? (
            <>
              <span className="spinner topic-tree__small-spinner" />
              Moving…
            </>
          ) : (
            <>
              <CornerDownRight size={15} />
              {isTopicDestination ? "Move here" : "Make separate"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MoveTopicOverlay;
