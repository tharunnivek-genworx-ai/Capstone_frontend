import React, { useEffect, useRef } from "react";
import type { StudyMaterialVersionSummary } from "../../types/studyMaterial.types";
import VersionLineageInfo from "./VersionLineageInfo";

interface StudyMaterialVersionPanelProps {
  versions: StudyMaterialVersionSummary[];
  activeVersionId: string | null;
  viewingVersionId: string | null;
  isLoading: boolean;
  isUnarchiving: boolean;
  mode: "active" | "archived";
  studentArchiveExpanded: boolean;
  onStudentArchiveExpandedChange: (expanded: boolean) => void;
  focusStudentArchiveNonce: number;
  onSelectVersion: (versionId: string) => void;
  onUnarchiveVersion: (versionId: string) => void;
  children?: React.ReactNode;
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

function partitionVersions(versions: StudyMaterialVersionSummary[]) {
  const workspace: StudyMaterialVersionSummary[] = [];
  const studentArchive: StudyMaterialVersionSummary[] = [];
  for (const version of versions) {
    if (
      version.mentor_display_badge === "Previous for students" ||
      version.mentor_display_badge === "In student archive"
    ) {
      studentArchive.push(version);
    } else {
      workspace.push(version);
    }
  }
  return { workspace, studentArchive };
}

interface VersionListItemProps {
  version: StudyMaterialVersionSummary;
  isSelected: boolean;
  isArchiveMode: boolean;
  isUnarchiving: boolean;
  onSelectVersion: (versionId: string) => void;
  onUnarchiveVersion: (versionId: string) => void;
}

const VersionListItem: React.FC<VersionListItemProps> = ({
  version,
  isSelected,
  isArchiveMode,
  isUnarchiving,
  onSelectVersion,
  onUnarchiveVersion,
}) => {
  const displayBadge = version.mentor_display_badge;

  return (
    <li key={version.version_id}>
      <button
        type="button"
        className={`study-material-version-panel__item${
          isSelected ? " study-material-version-panel__item--selected" : ""
        }`}
        onClick={() => onSelectVersion(version.version_id)}
      >
        <div className="study-material-version-panel__item-top">
          <span className="study-material-version-panel__label">{version.display_label}</span>
          <div className="study-material-version-panel__badges">
            {displayBadge && (
              <span
                className={`study-material-version-panel__badge ${badgeModifier(displayBadge)}`}
              >
                {displayBadgeLabel(displayBadge)}
              </span>
            )}
            {version.lineage_chain.length > 0 && (
              <VersionLineageInfo
                lineageChain={version.lineage_chain}
                onSelectVersion={onSelectVersion}
              />
            )}
          </div>
        </div>
        <span className="study-material-version-panel__date">{formatDate(version.created_at)}</span>
        {isSelected && version.student_visibility_hint && (
          <p className="study-material-version-panel__visibility-hint">
            {version.student_visibility_hint}
          </p>
        )}
        {version.mentor_feedback_preview && (
          <p className="study-material-version-panel__feedback">
            &ldquo;{version.mentor_feedback_preview}&rdquo;
          </p>
        )}
        {version.based_on_version_number != null && (
          <p className="study-material-version-panel__lineage">
            Based on{" "}
            <button
              type="button"
              className="study-material-version-panel__lineage-link"
              onClick={(e) => {
                e.stopPropagation();
                if (version.based_on_version_id) {
                  onSelectVersion(version.based_on_version_id);
                }
              }}
            >
              v{version.based_on_version_number}
            </button>
          </p>
        )}
      </button>

      {isSelected && isArchiveMode && (
        <div className="study-material-version-panel__actions">
          <button
            type="button"
            className="btn-secondary study-material-version-panel__action-btn"
            onClick={() => onUnarchiveVersion(version.version_id)}
            disabled={isUnarchiving}
          >
            {isUnarchiving ? "Restoring…" : "Restore to drafts"}
          </button>
        </div>
      )}
    </li>
  );
};

const StudyMaterialVersionPanel: React.FC<StudyMaterialVersionPanelProps> = ({
  versions,
  activeVersionId,
  viewingVersionId,
  isLoading,
  isUnarchiving,
  mode,
  studentArchiveExpanded,
  onStudentArchiveExpandedChange,
  focusStudentArchiveNonce,
  onSelectVersion,
  onUnarchiveVersion,
  children,
}) => {
  const selectedId = viewingVersionId ?? activeVersionId;
  const isArchiveMode = mode === "archived";
  const studentArchiveSectionRef = useRef<HTMLDivElement>(null);
  const { workspace, studentArchive } = partitionVersions(versions);

  useEffect(() => {
    if (focusStudentArchiveNonce === 0 || !studentArchiveExpanded) return;
    studentArchiveSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusStudentArchiveNonce, studentArchiveExpanded]);

  const renderVersionList = (list: StudyMaterialVersionSummary[]) => (
    <ul className="study-material-version-panel__list">
      {list.map((version) => (
        <VersionListItem
          key={version.version_id}
          version={version}
          isSelected={version.version_id === selectedId}
          isArchiveMode={isArchiveMode}
          isUnarchiving={isUnarchiving}
          onSelectVersion={onSelectVersion}
          onUnarchiveVersion={onUnarchiveVersion}
        />
      ))}
    </ul>
  );

  return (
    <aside className="study-material-version-panel">
      {children}
      <div className="study-material-version-panel__header">
        <h3 className="study-material-version-panel__title">
          {isArchiveMode ? "Your archive" : "Your workspace"}
        </h3>
        <p className="study-material-version-panel__subtitle">
          {isArchiveMode
            ? "Drafts you moved out of your working list. Students are not affected."
            : "Versions you edit and publish. Older live versions are in the student archive below."}
        </p>
      </div>

      {isLoading ? (
        <div className="study-material-version-panel__loading">
          <span className="spinner" />
        </div>
      ) : isArchiveMode ? (
        versions.length === 0 ? (
          <p className="study-material-version-panel__empty">No archived drafts.</p>
        ) : (
          renderVersionList(versions)
        )
      ) : (
        <div className="study-material-version-panel__sections">
          <section className="study-material-version-panel__section">
            <h4 className="study-material-version-panel__section-title">Editing &amp; publishing</h4>
            {workspace.length === 0 ? (
              <p className="study-material-version-panel__section-empty">
                {studentArchive.length > 0
                  ? "No unpublished drafts. Live content and student archive are unchanged."
                  : "No versions yet."}
              </p>
            ) : (
              renderVersionList(workspace)
            )}
          </section>

          {studentArchive.length > 0 && (
            <section
              ref={studentArchiveSectionRef}
              className="study-material-version-panel__section study-material-version-panel__section--archive"
            >
              <button
                type="button"
                className="study-material-version-panel__section-toggle"
                onClick={() => onStudentArchiveExpandedChange(!studentArchiveExpanded)}
                aria-expanded={studentArchiveExpanded}
              >
                <span className="study-material-version-panel__section-title">
                  Previous for students
                  <span className="study-material-version-panel__section-count">
                    {studentArchive.length}
                  </span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`study-material-version-panel__section-chevron${
                    studentArchiveExpanded
                      ? " study-material-version-panel__section-chevron--open"
                      : ""
                  }`}
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <p className="study-material-version-panel__section-hint">
                Students can still read these in Previous versions. Publish one to restore it as live.
              </p>
              {studentArchiveExpanded && renderVersionList(studentArchive)}
            </section>
          )}
        </div>
      )}
    </aside>
  );
};

export default StudyMaterialVersionPanel;
