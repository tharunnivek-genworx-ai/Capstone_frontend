import React from "react";
import type { NavSuggestion } from "../../types/traineeNodePanel.types";

interface ComingSoonBannerProps {
  siblingSuggestions: NavSuggestion[];
  onNavigate: (nodeId: string) => void;
}

const ComingSoonBanner: React.FC<ComingSoonBannerProps> = ({
  siblingSuggestions,
  onNavigate,
}) => (
  <div className="topic-detail-panel__coming-soon">
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <i
        className="ti ti-lock topic-detail-panel__muted-icon"
        aria-hidden="true"
        style={{ fontSize: 20, marginTop: 2 }}
      />
      <div>
        <p className="topic-detail-panel__coming-soon-title">
          This lesson isn&apos;t available yet.
        </p>
        <p className="topic-detail-panel__coming-soon-text">
          It will be published soon.
        </p>
      </div>
    </div>
    {siblingSuggestions.length > 0 && (
      <>
        <p
          className="topic-detail-panel__coming-soon-text"
          style={{ marginTop: 16, marginBottom: 0, fontWeight: 500, color: "#111827" }}
        >
          Meanwhile, continue with:
        </p>
        <div className="topic-detail-panel__chip-row">
          {siblingSuggestions.map((sibling) => (
            <button
              key={sibling.node_id}
              type="button"
              className="topic-detail-panel__chip"
              onClick={() => onNavigate(sibling.node_id)}
            >
              {sibling.title}
              <i className="ti ti-arrow-right" aria-hidden="true" style={{ fontSize: 14 }} />
            </button>
          ))}
        </div>
      </>
    )}
  </div>
);

export default ComingSoonBanner;
