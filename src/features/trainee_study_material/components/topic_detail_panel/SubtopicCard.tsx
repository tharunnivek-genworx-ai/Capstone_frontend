import React from "react";
import type { SubtopicBadgeKind, SubtopicPanelItem } from "../../types/traineeNodePanel.types";

interface SubtopicCardProps {
  subtopic: SubtopicPanelItem;
  onNavigate?: (nodeId: string) => void;
}

function badgeClass(kind: SubtopicBadgeKind): string {
  switch (kind) {
    case "completed":
      return "topic-detail-panel__badge--done";
    case "in_progress":
      return "topic-detail-panel__badge--progress";
    case "locked":
      return "topic-detail-panel__badge--locked";
    default:
      return "topic-detail-panel__badge--available";
  }
}

const SubtopicCard: React.FC<SubtopicCardProps> = ({ subtopic, onNavigate }) => {
  const isLocked = !subtopic.is_published;

  return (
    <button
      type="button"
      className={`topic-detail-panel__subtopic-row ${
        isLocked
          ? "topic-detail-panel__subtopic-row--locked"
          : "topic-detail-panel__subtopic-row--clickable"
      }`}
      onClick={() => !isLocked && onNavigate?.(subtopic.node_id)}
      disabled={isLocked}
    >
      <div
        className={`topic-detail-panel__subtopic-icon ${
          isLocked
            ? "topic-detail-panel__subtopic-icon--locked"
            : "topic-detail-panel__subtopic-icon--available"
        }`}
      >
        {subtopic.title.charAt(0).toUpperCase()}
      </div>
      <div className="topic-detail-panel__subtopic-info">
        <div className="topic-detail-panel__subtopic-name">{subtopic.title}</div>
        <div className="topic-detail-panel__subtopic-meta">{subtopic.meta_label}</div>
      </div>
      <span className={`topic-detail-panel__badge ${badgeClass(subtopic.badge_kind)}`}>
        {subtopic.badge_kind === "locked" && (
          <i className="ti ti-lock" aria-hidden="true" style={{ fontSize: 12 }} />
        )}
        {subtopic.badge_label}
      </span>
      {!isLocked && (
        <i
          className="ti ti-chevron-right topic-detail-panel__muted-icon"
          aria-hidden="true"
          style={{ fontSize: 16 }}
        />
      )}
    </button>
  );
};

export default SubtopicCard;
