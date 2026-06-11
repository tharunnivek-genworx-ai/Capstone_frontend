// src/features/spaces/components/MoveTopicOverlay.tsx

import React from "react";
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
    <div
      style={{
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border)",
        padding: "0.875rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        flexShrink: 0,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Move topic
        </p>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>
          Click a topic in the outline below to place{" "}
          <strong style={{ color: "var(--color-text-secondary)" }}>"{movingNode.title}"</strong>{" "}
          under it.
        </p>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="btn-secondary"
        style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600 }}
        disabled={isSubmitting}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSelectIndividualSpace}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-lg)",
          border: `1.5px solid ${isIndividualSpace ? "var(--color-primary)" : "var(--color-border)"}`,
          background: isIndividualSpace ? "var(--color-primary-subtle)" : "var(--color-bg-surface)",
          cursor: "pointer",
          textAlign: "left",
        }}
        disabled={isSubmitting}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isIndividualSpace ? "var(--color-primary)" : "var(--color-text-muted)"} strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Make this topic an individual learning space
        </span>
      </button>

      {hasDestination && (
        <button
          type="button"
          onClick={onConfirm}
          className="btn-primary"
          style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} />
              Moving…
            </>
          ) : isTopicDestination ? (
            "OK — move here"
          ) : (
            "OK — make individual learning space"
          )}
        </button>
      )}
    </div>
  );
};

export default MoveTopicOverlay;
