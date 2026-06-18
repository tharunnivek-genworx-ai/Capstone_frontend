import React from "react";
import TraineeStudyMaterialPanel from "../TraineeStudyMaterialPanel";

interface TopicDetailReadingViewProps {
  nodeId: string;
  nodeTitle: string;
  onBack: () => void;
}

/** In-panel full reading view — back link + embedded study material viewer. */
const TopicDetailReadingView: React.FC<TopicDetailReadingViewProps> = ({
  nodeId,
  nodeTitle,
  onBack,
}) => (
  <div className="topic-detail-panel__reading">
    <div className="topic-detail-panel__reading-header">
      <button type="button" className="topic-detail-panel__reading-back" onClick={onBack}>
        <i
          className="ti ti-chevron-right"
          aria-hidden="true"
          style={{ transform: "rotate(180deg)" }}
        />
        Back to overview
      </button>
    </div>
    <TraineeStudyMaterialPanel nodeId={nodeId} nodeTitle={nodeTitle} embedded />
  </div>
);

export default TopicDetailReadingView;
