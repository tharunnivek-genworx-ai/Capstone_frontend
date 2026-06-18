import React from "react";
import type { BreadcrumbItem, NavSuggestion } from "../../types/traineeNodePanel.types";

interface TopicPanelHeaderProps {
  title: string;
  meta?: string;
  breadcrumbs?: BreadcrumbItem[];
  backNavigation?: NavSuggestion | null;
  onNavigate?: (nodeId: string) => void;
}

const TopicPanelHeader: React.FC<TopicPanelHeaderProps> = ({
  title,
  meta,
  breadcrumbs = [],
  backNavigation,
  onNavigate,
}) => {
  const showBreadcrumbs = breadcrumbs.length > 1;

  return (
    <>
      {backNavigation && onNavigate && (
        <button
          type="button"
          className="topic-detail-panel__panel-back"
          onClick={() => onNavigate(backNavigation.node_id)}
        >
          <i
            className="ti ti-chevron-right"
            aria-hidden="true"
            style={{ transform: "rotate(180deg)" }}
          />
          {backNavigation.label_prefix ?? "Back to"} {backNavigation.title}
        </button>
      )}
      <div className="topic-detail-panel__header">
        <div className="topic-detail-panel__icon">{title.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="topic-detail-panel__title">{title}</h2>
          {showBreadcrumbs ? (
            <nav className="topic-detail-panel__breadcrumb" aria-label="Topic path">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={item.node_id}>
                    {index > 0 && <span className="topic-detail-panel__breadcrumb-sep">›</span>}
                    {isLast ? (
                      <span>{item.title}</span>
                    ) : (
                      <button
                        type="button"
                        className="topic-detail-panel__breadcrumb-link"
                        onClick={() => onNavigate?.(item.node_id)}
                      >
                        {item.title}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          ) : meta ? (
            <p className="topic-detail-panel__meta">{meta}</p>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default TopicPanelHeader;
