import React from "react";
import { useTraineeStudyMaterial } from "../hooks/useTraineeStudyMaterial";
import StudyMaterialViewer from "./StudyMaterialViewer";

interface TraineeStudyMaterialPanelProps {
  nodeId: string;
  nodeTitle: string;
}

const TraineeStudyMaterialPanel: React.FC<TraineeStudyMaterialPanelProps> = ({
  nodeId,
  nodeTitle,
}) => {
  const trainee = useTraineeStudyMaterial({ nodeId, nodeTitle });

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

  return (
    <div className="study-material-page trainee-study-material-page">
      <div className="trainee-study-material-page__toolbar">
        <div className="trainee-study-material-page__progress">
          <span className="trainee-study-material-page__progress-label">Reading progress</span>
          <div className="trainee-study-material-page__progress-track">
            <div
              className="trainee-study-material-page__progress-fill"
              style={{ width: `${trainee.readPercent}%` }}
            />
          </div>
          <span className="trainee-study-material-page__progress-value">{trainee.readPercent}%</span>
        </div>
        <button
          type="button"
          className="btn-secondary trainee-study-material-page__download-btn"
          onClick={() => void trainee.handleDownloadPdf()}
          disabled={trainee.isDownloadingPdf}
        >
          {trainee.isDownloadingPdf ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>

      <div className="trainee-study-material-page__content">
        <StudyMaterialViewer
          nodeId={nodeId}
          content={trainee.material.content}
          title={nodeTitle}
          referenceMaterialId={trainee.material.reference_material_id}
          referenceImagesRefreshKey={trainee.material.version_id}
          scrollContainerRef={trainee.scrollContainerRef}
        />
      </div>
    </div>
  );
};

export default TraineeStudyMaterialPanel;
