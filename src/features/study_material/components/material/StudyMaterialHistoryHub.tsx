import React, { useMemo, useState } from "react";
import type { HistoryVersionPartitions } from "../../utils/versionHistoryPartitions";
import type { StudyMaterialVersionSummary } from "../../types/studyMaterial.types";

interface StudyMaterialHistoryHubProps {
  partitions: HistoryVersionPartitions;
  onSelectVersion: (versionId: string) => void;
  onGoToGeneratePage: () => void;
}

type HubSectionKey = "studentArchive" | "removedFromStudents" | "mentorArchive";

interface HubSectionConfig {
  key: HubSectionKey;
  title: string;
  hint: string;
  versions: StudyMaterialVersionSummary[];
}

function badgeModifier(badge: string): string {
  switch (badge) {
    case "Live for students":
      return "study-material-version-panel__badge--live";
    case "Previous for students":
    case "In student archive":
      return "study-material-version-panel__badge--previous";
    case "In your archive":
      return "study-material-version-panel__badge--archive";
    case "Removed from students":
      return "study-material-version-panel__badge--removed";
    default:
      return "study-material-version-panel__badge--draft";
  }
}

function displayBadgeLabel(badge: string): string {
  if (badge === "Previous for students") return "In student archive";
  return badge;
}

function formatDate(iso: string): string {
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

const StudyMaterialHistoryHub: React.FC<StudyMaterialHistoryHubProps> = ({
  partitions,
  onSelectVersion,
  onGoToGeneratePage,
}) => {
  const sections = useMemo<HubSectionConfig[]>(() => {
    const all: HubSectionConfig[] = [
      {
        key: "studentArchive",
        title: "Previous for students",
        hint: "Students can still read these in Previous versions. Publish one to restore it as live.",
        versions: partitions.studentArchive,
      },
      {
        key: "removedFromStudents",
        title: "Removed from students",
        hint: "These versions are no longer visible to students. You can review or publish them again.",
        versions: partitions.removedFromStudents,
      },
      {
        key: "mentorArchive",
        title: "Your archive",
        hint: "Drafts you moved out of your working list. Students are not affected.",
        versions: partitions.mentorArchive,
      },
    ];
    return all.filter((section) => section.versions.length > 0);
  }, [partitions]);

  const [expandedSections, setExpandedSections] = useState<Record<HubSectionKey, boolean>>(() => {
    const firstKey = sections[0]?.key;
    return {
      studentArchive: firstKey === "studentArchive",
      removedFromStudents: firstKey === "removedFromStudents",
      mentorArchive: firstKey === "mentorArchive",
    };
  });

  const toggleSection = (key: HubSectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="sm-history-hub">
      <header className="sm-history-hub__header">
        <h2 className="sm-history-hub__title">Version history</h2>
        <p className="sm-history-hub__subtitle">
          This topic has no active draft. Stored versions are listed below — open one to review,
          publish, or restore it, or{" "}
          <button
            type="button"
            className="sm-history-hub__subtitle-link"
            onClick={onGoToGeneratePage}
          >
            generate a new draft completely
          </button>
          .
        </p>
      </header>

      <div className="sm-history-hub__sections">
        {sections.map((section) => {
          const isExpanded = expandedSections[section.key];
          return (
            <section key={section.key} className="sm-history-hub__section">
              <button
                type="button"
                className="sm-history-hub__section-toggle"
                onClick={() => toggleSection(section.key)}
                aria-expanded={isExpanded}
              >
                <span className="sm-history-hub__section-title">
                  {section.title}
                  <span className="sm-history-hub__section-count">{section.versions.length}</span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`sm-history-hub__section-chevron${
                    isExpanded ? " sm-history-hub__section-chevron--open" : ""
                  }`}
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className="sm-history-hub__section-body">
                  <p className="sm-history-hub__section-hint">{section.hint}</p>
                  <ul className="sm-history-hub__version-list">
                    {section.versions.map((version) => (
                      <li key={version.version_id}>
                        <button
                          type="button"
                          className="sm-history-hub__version-row"
                          onClick={() => onSelectVersion(version.version_id)}
                        >
                          <div className="sm-history-hub__version-row-main">
                            <span className="sm-history-hub__version-label">
                              {version.display_label}
                            </span>
                            {version.mentor_display_badge && (
                              <span
                                className={`study-material-version-panel__badge ${badgeModifier(
                                  version.mentor_display_badge,
                                )}`}
                              >
                                {displayBadgeLabel(version.mentor_display_badge)}
                              </span>
                            )}
                          </div>
                          <span className="sm-history-hub__version-date">
                            {formatDate(version.created_at)}
                          </span>
                          {version.student_visibility_hint && (
                            <p className="sm-history-hub__version-hint">
                              {version.student_visibility_hint}
                            </p>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default StudyMaterialHistoryHub;
