import React from "react";
import { Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VersionLineageItem } from "../../types/studyMaterial.types";
import { normalizeStudyContent } from "../../utils/markdownConversion";
import {
  studyMaterialRehypePlugins,
  studyMaterialRemarkPlugins,
} from "../../utils/studyMaterialMarkdownPlugins";
import ReferenceImagesPanel from "../reference/ReferenceImagesPanel";
import StudyMaterialDocument from "./StudyMaterialDocument";
import VersionLineageInfo from "../version/VersionLineageInfo";

interface StudyMaterialViewerProps {
  nodeId: string;
  content: string;
  title?: string;
  versionLabel?: string | null;
  isWorkingDraft?: boolean;
  referenceMaterialId?: string | null;
  referenceImagesRefreshKey?: string | null;
  canArchive?: boolean;
  isArchiving?: boolean;
  onArchive?: () => void;
  lineageChain?: VersionLineageItem[];
  onSelectLineageVersion?: (versionId: string) => void;
  canPublish?: boolean;
  canUnpublish?: boolean;
  publishButtonLabel?: string;
  unpublishButtonLabel?: string;
  publishDisabledTooltip?: string | null;
  unpublishTooltip?: string | null;
  unpublishDisabledTooltip?: string | null;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  canDownloadPdf?: boolean;
  isDownloadingPdf?: boolean;
  onDownloadPdf?: () => void;
  hideReferenceImages?: boolean;
  scrollContainerRef?: React.Ref<HTMLDivElement>;
  /** Hide title/actions row — used inside focus modal where chrome lives outside */
  compactHeader?: boolean;
  /** Hide the full header — mentor workspace renders chrome externally */
  hideHeader?: boolean;
  /** Paper-like reading layout for focus and study views */
  documentLayout?: boolean;
  /** Opens the full-screen focus reading modal */
  onOpenFocusView?: () => void;
}

const StudyMaterialViewer: React.FC<StudyMaterialViewerProps> = ({
  nodeId,
  content,
  title,
  versionLabel,
  isWorkingDraft = false,
  referenceMaterialId,
  referenceImagesRefreshKey,
  canArchive = false,
  isArchiving = false,
  onArchive,
  lineageChain = [],
  onSelectLineageVersion,
  canPublish = false,
  canUnpublish = false,
  publishButtonLabel = "Make live for students",
  unpublishButtonLabel = "Remove from students",
  publishDisabledTooltip = null,
  unpublishTooltip = null,
  unpublishDisabledTooltip = null,
  isPublishing = false,
  isUnpublishing = false,
  onPublish,
  onUnpublish,
  canDownloadPdf = false,
  isDownloadingPdf = false,
  onDownloadPdf,
  hideReferenceImages = false,
  scrollContainerRef,
  compactHeader = false,
  hideHeader = false,
  documentLayout = false,
  onOpenFocusView,
}) => {
  const markdown = normalizeStudyContent(content);
  const remarkPlugins = [...studyMaterialRemarkPlugins, remarkGfm];
  const showPublish = Boolean(onPublish) && (canPublish || publishDisabledTooltip);
  const showUnpublish = Boolean(onUnpublish) && (canUnpublish || unpublishDisabledTooltip);
  const showHeaderActions =
    !hideHeader &&
    !compactHeader &&
    (title || showPublish || showUnpublish || canArchive || Boolean(versionLabel) || Boolean(onOpenFocusView));

  return (
    <div className={`study-material-viewer${compactHeader ? " study-material-viewer--compact" : ""}`}>
      {showHeaderActions && (
        <div className="study-material-viewer__header">
          {(title || showPublish || showUnpublish || canArchive || (canDownloadPdf && onDownloadPdf)) && (
            <div className="study-material-viewer__title-row">
              {title ? <h2 className="study-material-viewer__title">{title}</h2> : <span />}
              <div className="study-material-viewer__title-actions">
                {canArchive && onArchive && (
                  <button
                    type="button"
                    className="btn-secondary study-material-viewer__archive-btn"
                    onClick={onArchive}
                    disabled={isArchiving}
                    title="Hide from your working drafts. Does not change what students see."
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
                    {isArchiving ? "Moving…" : "Move to archive"}
                  </button>
                )}
                {showPublish && (
                  <button
                    type="button"
                    className="btn-primary study-material-viewer__publish-btn"
                    onClick={canPublish ? onPublish : undefined}
                    disabled={!canPublish || isPublishing || isUnpublishing}
                    title={!canPublish ? publishDisabledTooltip ?? undefined : undefined}
                    style={!canPublish ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                  >
                    {isPublishing ? "Making live…" : publishButtonLabel}
                  </button>
                )}
                {showUnpublish && (
                  <button
                    type="button"
                    className="btn-secondary study-material-viewer__unpublish-btn"
                    onClick={canUnpublish ? onUnpublish : undefined}
                    disabled={!canUnpublish || isPublishing || isUnpublishing}
                    title={
                      !canUnpublish
                        ? unpublishDisabledTooltip ?? undefined
                        : unpublishTooltip ?? undefined
                    }
                    style={!canUnpublish ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                  >
                    {isUnpublishing ? "Removing…" : unpublishButtonLabel}
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
              <div className="study-material-viewer__version-meta">
                <span className="study-material-viewer__version-badge">
                  {versionLabel}
                  {isWorkingDraft && (
                    <span className="study-material-viewer__version-badge-working">
                      {" "}(working draft)
                    </span>
                  )}
                </span>
                {lineageChain.length > 0 && onSelectLineageVersion && (
                  <VersionLineageInfo
                    lineageChain={lineageChain}
                    onSelectVersion={onSelectLineageVersion}
                    showHint
                  />
                )}
              </div>
              {onOpenFocusView && (
                <button
                  type="button"
                  className="btn-secondary study-material-viewer__focus-btn"
                  onClick={onOpenFocusView}
                  title="Open study material in a focused reading view"
                >
                  <Maximize2 size={14} aria-hidden />
                  Reading view
                </button>
              )}
            </div>
          )}
          {!versionLabel && onOpenFocusView && (
            <div className="study-material-viewer__version-row study-material-viewer__version-row--focus-only">
              <button
                type="button"
                className="btn-secondary study-material-viewer__focus-btn"
                onClick={onOpenFocusView}
                title="Open study material in a focused reading view"
              >
                <Maximize2 size={14} aria-hidden />
                Reading view
              </button>
            </div>
          )}
        </div>
      )}
      {!hideHeader && compactHeader && versionLabel && (
        <div className="study-material-viewer__version-row study-material-viewer__version-row--compact">
          <div className="study-material-viewer__version-meta">
            <span className="study-material-viewer__version-badge">
              {versionLabel}
              {isWorkingDraft && (
                <span className="study-material-viewer__version-badge-working">
                  {" "}(working draft)
                </span>
              )}
            </span>
            {lineageChain.length > 0 && onSelectLineageVersion && (
              <VersionLineageInfo
                lineageChain={lineageChain}
                onSelectVersion={onSelectLineageVersion}
                showHint
              />
            )}
          </div>
          {onOpenFocusView && (
            <button
              type="button"
              className="btn-secondary study-material-viewer__focus-btn"
              onClick={onOpenFocusView}
              title="Open study material in a focused reading view"
            >
              <Maximize2 size={14} aria-hidden />
              Reading view
            </button>
          )}
        </div>
      )}
      <div className="study-material-viewer__scroll" ref={scrollContainerRef}>
        {documentLayout ? (
          <StudyMaterialDocument mode={compactHeader ? "focus" : "reader"}>
            <div className="study-material-viewer__body">
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={studyMaterialRehypePlugins}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </StudyMaterialDocument>
        ) : (
          <div className="study-material-viewer__body">
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={studyMaterialRehypePlugins}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        )}
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
