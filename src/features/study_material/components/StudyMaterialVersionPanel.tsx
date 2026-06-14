import React from "react";
import type { StudyMaterialVersionSummary } from "../types/studyMaterial.types";
import VersionLineageInfo from "./VersionLineageInfo";

interface StudyMaterialVersionPanelProps {
  versions: StudyMaterialVersionSummary[];
  activeVersionId: string | null;
  viewingVersionId: string | null;
  isLoading: boolean;
  isUnarchiving: boolean;
  mode: "active" | "archived";
  onSelectVersion: (versionId: string) => void;
  onUnarchiveVersion: (versionId: string) => void;
  onBackToActiveHistory?: () => void;
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

const StudyMaterialVersionPanel: React.FC<StudyMaterialVersionPanelProps> = ({
  versions,
  activeVersionId,
  viewingVersionId,
  isLoading,
  isUnarchiving,
  mode,
  onSelectVersion,
  onUnarchiveVersion,
  onBackToActiveHistory,
}) => {
  const selectedId = viewingVersionId ?? activeVersionId;
  const isArchiveMode = mode === "archived";

  return (
    <aside className="study-material-version-panel">
      <div className="study-material-version-panel__header">
        <h3 className="study-material-version-panel__title">
          {isArchiveMode ? "Archived drafts" : "Version history"}
        </h3>
        <p className="study-material-version-panel__subtitle">
          {isArchiveMode
            ? "Archived versions are hidden from working history but kept for reference."
            : "Each action creates a new version. The active draft is your working copy."}
        </p>
        {isArchiveMode && onBackToActiveHistory && (
          <button
            type="button"
            className="study-material-version-panel__back-link"
            onClick={onBackToActiveHistory}
          >
            ← Back to version history
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="study-material-version-panel__loading">
          <span className="spinner" />
        </div>
      ) : versions.length === 0 ? (
        <p className="study-material-version-panel__empty">
          {isArchiveMode ? "No archived versions." : "No versions yet."}
        </p>
      ) : (
        <ul className="study-material-version-panel__list">
          {versions.map((version) => {
            const isSelected = version.version_id === selectedId;
            const isActive = version.is_active;
            const isPublished = version.is_published;

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
                    <span className="study-material-version-panel__label">
                      {version.display_label}
                    </span>
                    <div className="study-material-version-panel__badges">
                      {isArchiveMode && (
                        <span className="study-material-version-panel__badge study-material-version-panel__badge--archived">
                          Archived
                        </span>
                      )}
                      {isActive && !isArchiveMode && (
                        <span className="study-material-version-panel__badge study-material-version-panel__badge--active">
                          Active
                        </span>
                      )}
                      {isPublished && (
                        <span className="study-material-version-panel__badge study-material-version-panel__badge--published">
                          Published
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
                  <span className="study-material-version-panel__date">
                    {formatDate(version.created_at)}
                  </span>
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
                      {isUnarchiving ? "Restoring…" : "Unarchive"}
                    </button>
                  </div>
                )}

              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default StudyMaterialVersionPanel;
