import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import StudyMaterialViewer from "../../../study_material/components/material/StudyMaterialViewer";
import { traineeStudyMaterialService } from "../../services/traineeStudyMaterialService";

interface ArchivedStudyMaterialReaderProps {
  nodeId: string;
  versionId: string;
  nodeTitle: string;
  isCurrentVersion?: boolean;
  onBack: () => void;
}

interface ReaderMaterial {
  content: string;
  version_id: string;
  reference_material_id: string | null;
}

function extractErrorDetail(err: unknown): string {
  const e = err as { response?: { data?: string | { detail?: string } }; message?: string };
  if (typeof e?.response?.data === "string") return e.response.data;
  return e?.response?.data?.detail ?? e?.message ?? "Request failed.";
}

const ArchivedStudyMaterialReader: React.FC<ArchivedStudyMaterialReaderProps> = ({
  nodeId,
  versionId,
  nodeTitle,
  isCurrentVersion = false,
  onBack,
}) => {
  const [material, setMaterial] = useState<ReaderMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loadMaterial = isCurrentVersion
      ? traineeStudyMaterialService.getPublished(nodeId).then((published) => ({
          content: published.content,
          version_id: published.version_id,
          reference_material_id: published.reference_material_id,
        }))
      : traineeStudyMaterialService.getArchived(nodeId, versionId).then((archived) => ({
          content: archived.content,
          version_id: archived.version_id,
          reference_material_id: archived.reference_material_id,
        }));

    loadMaterial
      .then((loaded) => {
        if (!cancelled) setMaterial(loaded);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(extractErrorDetail(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, versionId, isCurrentVersion]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusTargetRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const handleDownloadPdf = async () => {
    if (!material || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      if (isCurrentVersion) {
        await traineeStudyMaterialService.downloadPublishedPdf(nodeId, `${nodeTitle}.pdf`);
      } else {
        await traineeStudyMaterialService.downloadArchivedPdf(
          nodeId,
          versionId,
          `${nodeTitle}.pdf`
        );
      }
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="topic-detail-panel__reading">
        <div className="study-material-loading">
          <span className="spinner study-material-loading__spinner" />
          <p>Loading previous version…</p>
        </div>
      </div>
    );
  }

  if (loadError || !material) {
    return (
      <div className="topic-detail-panel__reading">
        <button type="button" className="topic-detail-panel__reading-back" onClick={onBack}>
          Back to previous versions
        </button>
        <p>{loadError ?? "Could not load archived material."}</p>
      </div>
    );
  }

  const toolbar = (
    <div className="trainee-study-material-page__toolbar">
      <div className="topic-detail-panel__archive-reader-label">
        <span className="topic-detail-panel__archive-reference-badge">Reference only</span>
        <span>{nodeTitle}</span>
      </div>
      <div className="trainee-study-material-page__actions">
        <button
          type="button"
          className="btn-secondary trainee-study-material-page__download-btn"
          onClick={() => void handleDownloadPdf()}
          disabled={isDownloadingPdf}
        >
          {isDownloadingPdf ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          className="btn-secondary trainee-study-material-page__fullscreen-btn"
          onClick={() => setIsFullscreen((v) => !v)}
        >
          {isFullscreen ? "Exit full screen" : "Open in full screen"}
        </button>
      </div>
    </div>
  );

  const viewer = (
    <StudyMaterialViewer
      nodeId={nodeId}
      content={material.content}
      title={nodeTitle}
      referenceMaterialId={material.reference_material_id}
      referenceImagesRefreshKey={material.version_id}
      scrollContainerRef={scrollContainerRef}
      hideReferenceImages={isFullscreen}
      documentLayout
      hideHeader
    />
  );

  const studySurface = (
    <div
      ref={focusTargetRef}
      className="trainee-study-material-page__focus-surface"
      tabIndex={0}
      role="document"
      aria-label={`Study material ${nodeTitle}`}
    >
      {viewer}
    </div>
  );

  const fullscreenOverlay = isFullscreen
    ? createPortal(
        <div className="learning-experience learning-portal">
          <div
          className="trainee-study-material-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={`${nodeTitle} study material`}
        >
          <div className="trainee-study-material-fullscreen__inner">
            {toolbar}
            <div className="trainee-study-material-fullscreen__content">{studySurface}</div>
          </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="topic-detail-panel__reading">
      <div className="topic-detail-panel__reading-header">
        <button type="button" className="topic-detail-panel__reading-back" onClick={onBack}>
          <i
            className="ti ti-chevron-right"
            aria-hidden="true"
            style={{ transform: "rotate(180deg)" }}
          />
          Back to previous versions
        </button>
      </div>
      <p className="topic-detail-panel__archive-hint topic-detail-panel__archive-hint--inline">
        For understanding — not required for completion.
      </p>
      {!isFullscreen && (
        <div className="study-material-page trainee-study-material-page trainee-study-material-page--embedded">
          {toolbar}
          <div className="trainee-study-material-page__content">{studySurface}</div>
        </div>
      )}
      {fullscreenOverlay}
    </div>
  );
};

export default ArchivedStudyMaterialReader;
