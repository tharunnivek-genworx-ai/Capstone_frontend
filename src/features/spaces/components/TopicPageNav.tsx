import React from "react";
import type { TopicContentPage } from "../types/node.types";

// Re-export for backward compatibility
export type { TopicContentPage };

interface TopicPageNavProps {
  currentPage: TopicContentPage;
  canAccessStudyMaterial: boolean;
  canAccessQuiz: boolean;
  onPageChange: (page: TopicContentPage) => void;
}

const PAGE_LABELS: Record<TopicContentPage, string> = {
  1: "Teaching",
  2: "Study Material",
  3: "Quiz",
};

const TopicPageNav: React.FC<TopicPageNavProps> = ({
  currentPage,
  canAccessStudyMaterial,
  canAccessQuiz,
  onPageChange,
}) => {
  const canGoPrev = currentPage > 1;
  const canGoNext =
    (currentPage === 1 && canAccessStudyMaterial) ||
    (currentPage === 2 && canAccessQuiz);

  const handlePrev = () => {
    if (currentPage === 2) onPageChange(1);
    else if (currentPage === 3) onPageChange(2);
  };

  const handleNext = () => {
    if (currentPage === 1 && canAccessStudyMaterial) onPageChange(2);
    else if (currentPage === 2 && canAccessQuiz) onPageChange(3);
  };

  const isPageEnabled = (page: TopicContentPage): boolean => {
    if (page === 1) return true;
    if (page === 2) return canAccessStudyMaterial;
    return canAccessQuiz;
  };

  return (
    <div style={{ marginTop: "0.625rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
        }}
      >
        <button
          type="button"
          aria-label="Previous page"
          onClick={handlePrev}
          disabled={!canGoPrev}
          style={arrowButtonStyle(!canGoPrev)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ display: "flex", gap: "0.375rem" }}>
          {([1, 2, 3] as TopicContentPage[]).map((page) => {
            const enabled = isPageEnabled(page);
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                type="button"
                title={PAGE_LABELS[page]}
                disabled={!enabled}
                onClick={() => enabled && onPageChange(page)}
                style={{
                  minWidth: "2rem",
                  height: "2rem",
                  padding: "0 0.5rem",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: isActive ? "var(--color-primary-subtle)" : "var(--color-bg-surface)",
                  color: isActive ? "var(--color-primary)" : enabled ? "var(--color-text-secondary)" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: enabled ? "pointer" : "not-allowed",
                  opacity: enabled ? 1 : 0.45,
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Next page"
          onClick={handleNext}
          disabled={!canGoNext}
          style={arrowButtonStyle(!canGoNext)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

function arrowButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-surface)",
    color: disabled ? "var(--color-text-muted)" : "var(--color-text-primary)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    boxShadow: "var(--shadow-subtle)",
  };
}

export default TopicPageNav;
