import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen } from "lucide-react";
import { useTraineeStudyMaterial } from "../hooks/useTraineeStudyMaterial";
import StudyMaterialViewer from "../../study_material/components/material/StudyMaterialViewer";

interface TraineeStudyMaterialPanelProps {
  nodeId: string;
  nodeTitle: string;
  /** When true, fills the topic detail panel instead of a standalone page. */
  embedded?: boolean;
}

interface StudyMaterialToolbarProps {
  nodeTitle: string;
  readPercent: number;
  isDownloadingPdf: boolean;
  onDownloadPdf: () => void;
  onOpenFullscreen: () => void;
  onExitFullscreen?: () => void;
  isFullscreen?: boolean;
}

const StudyMaterialToolbar: React.FC<StudyMaterialToolbarProps> = ({
  nodeTitle,
  readPercent,
  isDownloadingPdf,
  onDownloadPdf,
  onOpenFullscreen,
  onExitFullscreen,
  isFullscreen = false,
}) => (
  <div className="trainee-study-material-page__toolbar">
    <div className="trainee-study-material-page__toolbar-main">
      <div className="trainee-study-material-page__toolbar-icon" aria-hidden>
        <BookOpen size={18} />
      </div>
      <div className="trainee-study-material-page__toolbar-copy">
        <p className="trainee-study-material-page__toolbar-eyebrow">Study material</p>
        <h2 className="trainee-study-material-page__toolbar-title">{nodeTitle}</h2>
      </div>
    </div>
    <div className="trainee-study-material-page__toolbar-right">
      <div className="trainee-study-material-page__progress">
        <span className="trainee-study-material-page__progress-label">Reading progress</span>
        <div className="trainee-study-material-page__progress-track">
          <div
            className="trainee-study-material-page__progress-fill"
            style={{ width: `${readPercent}%` }}
          />
        </div>
        <span className="trainee-study-material-page__progress-value">{readPercent}%</span>
      </div>
      <div className="trainee-study-material-page__actions">
        <button
          type="button"
          className="btn-secondary trainee-study-material-page__download-btn"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
        >
          {isDownloadingPdf ? "Preparing PDF…" : "Download PDF"}
        </button>
        {isFullscreen ? (
          <button
            type="button"
            className="btn-secondary trainee-study-material-page__fullscreen-btn"
            onClick={onExitFullscreen}
          >
            Exit full screen
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary trainee-study-material-page__fullscreen-btn"
            onClick={onOpenFullscreen}
          >
            Open in full screen
          </button>
        )}
      </div>
    </div>
  </div>
);

const TraineeStudyMaterialPanel: React.FC<TraineeStudyMaterialPanelProps> = ({
  nodeId,
  nodeTitle,
  embedded = false,
}) => {
  const trainee = useTraineeStudyMaterial({ nodeId, nodeTitle });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const focusTargetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusTargetRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  if (trainee.isLoading) {
    return (
      <div className="study-material-page trainee-study-material-page">
        <div className="study-material-loading">
          <span className="spinner study-material-loading__spinner" />
          <p className="study-material-loading__title">Loading study material</p>
          <p className="study-material-loading__subtitle">
            Fetching published content for &ldquo;{nodeTitle}&rdquo;…
          </p>
        </div>
      </div>
    );
  }

  if (trainee.loadError) {
    const isUnavailable =
      trainee.loadError.toLowerCase().includes("no published study material") ||
      trainee.loadError.toLowerCase().includes("not found");

    return (
      <div className="study-material-page trainee-study-material-page">
        <div className="study-material-loading">
          <p className="study-material-loading__title">
            {isUnavailable ? "Study material not available yet" : "Could not load study material"}
          </p>
          <p className="study-material-loading__subtitle">
            {isUnavailable
              ? "Your mentor has not published study material for this topic yet. Check back later."
              : trainee.loadError}
          </p>
        </div>
      </div>
    );
  }

  if (!trainee.material) return null;

  const toolbar = (
    <StudyMaterialToolbar
      nodeTitle={nodeTitle}
      readPercent={trainee.readPercent}
      isDownloadingPdf={trainee.isDownloadingPdf}
      onDownloadPdf={() => void trainee.handleDownloadPdf()}
      onOpenFullscreen={() => setIsFullscreen(true)}
      onExitFullscreen={() => setIsFullscreen(false)}
      isFullscreen={isFullscreen}
    />
  );

  const viewer = (
    <StudyMaterialViewer
      nodeId={nodeId}
      content={trainee.material.content}
      title={nodeTitle}
      referenceMaterialId={trainee.material.reference_material_id}
      referenceImagesRefreshKey={trainee.material.version_id}
      scrollContainerRef={trainee.scrollContainerRef}
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
    aria-label={`Study material for ${nodeTitle}`}
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
          aria-label={`${nodeTitle} study material full screen`}
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
    <>
      {!isFullscreen && (
        <div
          className={`study-material-page trainee-study-material-page${
            embedded ? " trainee-study-material-page--embedded" : ""
          }`}
        >
          {toolbar}
          <div className="trainee-study-material-page__content">{studySurface}</div>
        </div>
      )}
      {fullscreenOverlay}
    </>
  );
};

export default TraineeStudyMaterialPanel;
