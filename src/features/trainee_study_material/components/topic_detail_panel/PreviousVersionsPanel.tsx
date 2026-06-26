import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TraineeArchivedSmItem } from "../../types/traineeStudyMaterial.types";
import { traineeStudyMaterialService } from "../../services/traineeStudyMaterialService";

interface PreviousVersionsPanelProps {
  nodeId: string;
  spaceId: string;
  nodeTitle: string;
  onReadVersion: (versionId: string, versionLabel: string) => void;
}

const PreviousVersionsPanel: React.FC<PreviousVersionsPanelProps> = ({
  nodeId,
  spaceId,
  nodeTitle,
  onReadVersion,
}) => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<TraineeArchivedSmItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    traineeStudyMaterialService
      .listArchived(nodeId)
      .then((data) => {
        if (!cancelled) setVersions(data.versions);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(e?.response?.data?.detail ?? e?.message ?? "Could not load previous versions.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  if (isLoading) {
    return (
      <div className="topic-detail-panel__archive-loading">
        <span className="spinner" />
        <p>Loading previous versions…</p>
      </div>
    );
  }

  if (error) {
    return <p className="topic-detail-panel__archive-error">{error}</p>;
  }

  if (versions.length === 0) {
    return (
      <p className="topic-detail-panel__archive-empty">
        No previous versions are available for this topic.
      </p>
    );
  }

  return (
    <div className="topic-detail-panel__archive-list">
      <p className="topic-detail-panel__archive-hint">
        For understanding — not required for completion.
      </p>
      {versions.map((version) => (
        <div key={version.version_id} className="topic-detail-panel__archive-card">
          <div className="topic-detail-panel__archive-card-header">
            <span className="topic-detail-panel__archive-version-label">
              {version.version_label}
            </span>
            {version.you_read_this && (
              <span className="topic-detail-panel__archive-read-badge">You read this</span>
            )}
          </div>
          {version.is_current_version ? (
            <p className="topic-detail-panel__archive-meta">
              Archived quiz from current study material
            </p>
          ) : (
            version.superseded_at && (
              <p className="topic-detail-panel__archive-meta">
                Superseded{" "}
                {new Date(version.superseded_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )
          )}
          <div className="topic-detail-panel__archive-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onReadVersion(version.version_id, version.version_label)}
            >
              Read material
            </button>
            {version.has_archived_quiz && version.archived_quiz_id && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  navigate(
                    `/trainee/spaces/${spaceId}/nodes/${nodeId}/quiz/${version.archived_quiz_id}/archive-review`
                  )
                }
              >
                Review quiz
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="topic-detail-panel__archive-footnote">
        Reference only — progress on &ldquo;{nodeTitle}&rdquo; tracks the current version.
      </p>
    </div>
  );
};

export default PreviousVersionsPanel;
