import React from "react";
import type { TopicContentPage } from "../types/node.types";
import { Zap, FileText, ListChecks, Lightbulb } from "lucide-react";

// Re-export for backward compatibility
export type { TopicContentPage };

interface TopicPageNavProps {
  currentPage: TopicContentPage;
  canAccessStudyMaterial: boolean;
  canAccessQuiz: boolean;
  canAccessHints: boolean;
  onPageChange: (page: TopicContentPage) => void;
  /** Override tooltip shown on the disabled Quiz tab. Derived from backend state in NodeDetailPanel. */
  quizDisabledTooltip?: string;
  /** Override tooltip shown on the disabled Hints tab. Derived from backend state in NodeDetailPanel. */
  hintsDisabledTooltip?: string;
}

const TopicPageNav: React.FC<TopicPageNavProps> = ({
  currentPage,
  canAccessStudyMaterial,
  canAccessQuiz,
  canAccessHints,
  onPageChange,
  quizDisabledTooltip,
  hintsDisabledTooltip,
}) => {
  const isPageEnabled = (page: TopicContentPage): boolean => {
    if (page === 1) return true;
    if (page === 2) return canAccessStudyMaterial;
    if (page === 3) return canAccessQuiz;
    return canAccessHints;
  };

  const getTabProps = (page: TopicContentPage) => {
    const enabled = isPageEnabled(page);
    const active = currentPage === page;
    return { enabled, active };
  };

  const tabs = [
    {
      page: 1 as TopicContentPage,
      label: "Generate",
      sublabel: "AI Draft",
      icon: Zap,
      color: "var(--color-primary)",
      bgActive: "var(--color-primary-subtle)",
      tooltip: "",
    },
    {
      page: 2 as TopicContentPage,
      label: "Material",
      sublabel: "View · Improve",
      icon: FileText,
      color: "var(--color-success)",
      bgActive: "rgba(16, 185, 129, 0.15)", // green tint
      tooltip: "Generate study material first",
    },
    {
      page: 3 as TopicContentPage,
      label: "Quiz",
      sublabel: "MCQ · Score",
      icon: ListChecks,
      color: "#f59e0b", // amber / gold
      bgActive: "rgba(245, 158, 11, 0.15)",
      tooltip: quizDisabledTooltip ?? "Generate study material first",
    },
    {
      page: 4 as TopicContentPage,
      label: "Hints",
      sublabel: "3 Progressive",
      icon: Lightbulb,
      color: "#8b5cf6", // purple
      bgActive: "rgba(139, 92, 246, 0.15)",
      tooltip: hintsDisabledTooltip ?? "Generate a quiz first",
    },
  ];

  return (
    <div
      role="tablist"
      className="topic-page-nav"
    >
      {tabs.map((tab) => {
        const { enabled, active } = getTabProps(tab.page);
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.page}
            role="tab"
            aria-selected={active}
            aria-disabled={!enabled}
            aria-label={`${tab.label} tab`}
            title={!enabled ? tab.tooltip : undefined}
            disabled={!enabled}
            onClick={() => enabled && onPageChange(tab.page)}
            className={`topic-page-nav__tab${active ? " topic-page-nav__tab--active" : ""}${!enabled ? " topic-page-nav__tab--disabled" : ""}`}
            style={{
              "--tab-color": tab.color,
              "--tab-bg": tab.bgActive,
            } as React.CSSProperties}
          >
            <Icon size={15} strokeWidth={active ? 2.5 : 2} className="topic-page-nav__icon" aria-hidden />
            <div className="topic-page-nav__labels">
              <span className="topic-page-nav__label">{tab.label}</span>
              <span className="topic-page-nav__sublabel">{tab.sublabel}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TopicPageNav;
