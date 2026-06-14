import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VersionLineageItem } from "../types/studyMaterial.types";
import ReferenceImagesPanel from "./ReferenceImagesPanel";
import VersionLineageInfo from "./VersionLineageInfo";

/** Recover markdown when older clients stored the full API JSON as a string. */
function normalizeStudyContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.includes('"content"')) {
    return raw;
  }
  try {
    const parsed = JSON.parse(trimmed) as { content?: string };
    if (typeof parsed.content === "string") return parsed.content;
  } catch {
    /* not JSON */
  }
  return raw;
}

interface StudyMaterialViewerProps {
  nodeId: string;
  content: string;
  title?: string;
  versionLabel?: string | null;
  referenceMaterialId?: string | null;
  referenceImagesRefreshKey?: string | null;
  canArchive?: boolean;
  isArchiving?: boolean;
  onArchive?: () => void;
  lineageChain?: VersionLineageItem[];
  onSelectLineageVersion?: (versionId: string) => void;
  canPublish?: boolean;
  canUnpublish?: boolean;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  canDownloadPdf?: boolean;
  isDownloadingPdf?: boolean;
  onDownloadPdf?: () => void;
  hideReferenceImages?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const StudyMaterialViewer: React.FC<StudyMaterialViewerProps> = ({
  nodeId,
  content,
  title,
  versionLabel,
  referenceMaterialId,
  referenceImagesRefreshKey,
  canArchive = false,
  isArchiving = false,
  onArchive,
  lineageChain = [],
  onSelectLineageVersion,
  canPublish = false,
  canUnpublish = false,
  isPublishing = false,
  isUnpublishing = false,
  onPublish,
  onUnpublish,
  canDownloadPdf = false,
  isDownloadingPdf = false,
  onDownloadPdf,
  hideReferenceImages = false,
  scrollContainerRef,
}) => {
  const markdown = normalizeStudyContent(content);

  return (
    <div className="study-material-viewer">
      <div className="study-material-viewer__header">
        {title && (
          <div className="study-material-viewer__title-row">
            <h2 className="study-material-viewer__title">{title}</h2>
            <div className="study-material-viewer__title-actions">
              {canArchive && onArchive && (
                <button
                  type="button"
                  className="btn-secondary study-material-viewer__archive-btn"
                  onClick={onArchive}
                  disabled={isArchiving}
                  title="Archive this version"
                >
                  {isArchiving ? (
                    <span className="spinner" style={{ width: "14px", height: "14px" }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                  )}
                  Archive
                </button>
              )}
              {canPublish && onPublish && (
                <button
                  type="button"
                  className="btn-primary study-material-viewer__publish-btn"
                  onClick={onPublish}
                  disabled={isPublishing || isUnpublishing}
                >
                  {isPublishing ? "Publishing…" : "Publish for trainees"}
                </button>
              )}
              {canUnpublish && onUnpublish && (
                <button
                  type="button"
                  className="btn-secondary study-material-viewer__unpublish-btn"
                  onClick={onUnpublish}
                  disabled={isPublishing || isUnpublishing}
                >
                  {isUnpublishing ? "Unpublishing…" : "Unpublish"}
                </button>
              )}
              {canDownloadPdf && onDownloadPdf && (
                <button
                  type="button"
                  className="btn-secondary study-material-viewer__download-btn"
                  onClick={onDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? "Preparing PDF…" : "Download PDF"}
                </button>
              )}
            </div>
          </div>
        )}
        {versionLabel && (
          <div className="study-material-viewer__version-row">
            <span className="study-material-viewer__version-badge">{versionLabel}</span>
            {lineageChain.length > 0 && onSelectLineageVersion && (
              <VersionLineageInfo
                lineageChain={lineageChain}
                onSelectVersion={onSelectLineageVersion}
                showHint
              />
            )}
          </div>
        )}
      </div>
      <div className="study-material-viewer__scroll" ref={scrollContainerRef}>
        <div className="study-material-viewer__body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
        {!hideReferenceImages && (
          <ReferenceImagesPanel
            nodeId={nodeId}
            materialId={referenceMaterialId}
            refreshKey={referenceImagesRefreshKey}
          />
        )}
      </div>
    </div>
  );
};

export default StudyMaterialViewer;
