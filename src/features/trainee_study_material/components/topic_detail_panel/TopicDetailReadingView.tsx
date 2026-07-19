import React from "react";
import TraineeStudyMaterialPanel from "../TraineeStudyMaterialPanel";

interface TopicDetailReadingViewProps {
  nodeId: string;
  nodeTitle: string;
  spaceId: string;
  onBack: () => void;
  onNodesUnlocked?: (nodeIds: string[]) => void;
}

/** In-panel full reading view — back link + embedded study material viewer. */
const TopicDetailReadingView: React.FC<TopicDetailReadingViewProps> = ({
  nodeId,
  nodeTitle,
  spaceId,
  onBack,
  onNodesUnlocked,
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
    <TraineeStudyMaterialPanel
      nodeId={nodeId}
      nodeTitle={nodeTitle}
      spaceId={spaceId}
      embedded
      onNodesUnlocked={onNodesUnlocked}
    />
  </div>
);

export default TopicDetailReadingView;
