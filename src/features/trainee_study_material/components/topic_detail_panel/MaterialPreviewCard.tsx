import React from "react";

interface MaterialPreviewCardProps {
  title: string;
  preview: string;
  readTimeMinutes: number;
}

const MaterialPreviewCard: React.FC<MaterialPreviewCardProps> = ({
  title,
  preview,
  readTimeMinutes,
}) => (
  <div className="topic-detail-panel__material-preview">
    <div className="topic-detail-panel__material-preview-hdr">
      <span className="topic-detail-panel__material-preview-title">{title} — overview</span>
      <span className="topic-detail-panel__badge topic-detail-panel__badge--available">
        Published
      </span>
    </div>
    <div className="topic-detail-panel__material-preview-body">
      <p>{preview || "Open this topic to start reading."}</p>
      <p className="topic-detail-panel__material-preview-footer">
        Scroll to continue reading · {readTimeMinutes} min read
      </p>
    </div>
  </div>
);

export default MaterialPreviewCard;
