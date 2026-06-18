import React from "react";
import type { NavSuggestion } from "../../types/traineeNodePanel.types";

interface WhatsNextCardProps {
  nextUp: NavSuggestion;
  onNavigate: (nodeId: string) => void;
}

const WhatsNextCard: React.FC<WhatsNextCardProps> = ({ nextUp, onNavigate }) => {
  const linkLabel = nextUp.label_prefix ?? "Next up";

  return (
    <div className="topic-detail-panel__whats-next">
      <p className="topic-detail-panel__whats-next-label">What&apos;s next</p>
      <button
        type="button"
        className="topic-detail-panel__whats-next-link"
        onClick={() => onNavigate(nextUp.node_id)}
      >
        {linkLabel}: {nextUp.title}
        <i className="ti ti-arrow-right" aria-hidden="true" style={{ fontSize: 14 }} />
      </button>
    </div>
  );
};

export default WhatsNextCard;
