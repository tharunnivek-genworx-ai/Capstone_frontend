import React, { useState } from "react";
import type { TraineeNodePanelOut } from "../../types/traineeNodePanel.types";
import { useTopicQuizActions } from "../../hooks/useTopicQuizActions";
import TopicDetailReadingView from "./TopicDetailReadingView";
import TopicPanelHeader from "./TopicPanelHeader";
import TopicQuizActions from "./TopicQuizActions";
import ProgressBar from "./ProgressBar";
import MaterialPreviewCard from "./MaterialPreviewCard";
import WhatsNextCard from "./WhatsNextCard";

interface LeafAvailablePanelProps {
  panel: TraineeNodePanelOut;
  spaceId: string;
  nodeId: string;
  onNavigate: (nodeId: string) => void;
  onRefreshPanel: () => void;
}

const LeafAvailablePanel: React.FC<LeafAvailablePanelProps> = ({
  panel,
  spaceId,
  nodeId,
  onNavigate,
  onRefreshPanel,
}) => {
  const [isReading, setIsReading] = useState(false);
  const material = panel.study_material;
  const quizHandlers = useTopicQuizActions({
    spaceId,
    nodeId,
    quizActions: material?.quiz_actions,
  });

  if (isReading && material) {
    return (
      <TopicDetailReadingView
        nodeId={nodeId}
        nodeTitle={panel.title}
        onBack={() => {
          setIsReading(false);
          onRefreshPanel();
        }}
      />
    );
  }

  if (!material) return null;

  return (
    <div className="topic-detail-panel__scroll">
      <TopicPanelHeader
        title={panel.title}
        breadcrumbs={panel.breadcrumbs}
        backNavigation={panel.back_navigation}
        onNavigate={onNavigate}
      />

      {panel.is_fully_complete && (
        <div className="topic-detail-panel__complete-badge">
          <i className="ti ti-check-circle" aria-hidden="true" />
          Completed
        </div>
      )}

      <ProgressBar
        readPercent={material.read_percent}
        quizBadgeKind={material.quiz_badge_kind}
        quizBadgeLabel={material.quiz_badge_label}
      />
      <MaterialPreviewCard
        title={panel.title}
        preview={material.content_preview}
        readTimeMinutes={material.read_time_minutes}
      />

      <TopicQuizActions
        quiz={material.quiz_actions}
        isStartingQuiz={quizHandlers.isStartingQuiz}
        onTakeQuiz={() => void quizHandlers.handleTakeQuiz()}
        onViewAttempts={quizHandlers.handleViewAttempts}
        readAction={
          <button type="button" className="btn-primary" onClick={() => setIsReading(true)}>
            {material.reading_button_label}
          </button>
        }
      />

      {panel.next_up && <WhatsNextCard nextUp={panel.next_up} onNavigate={onNavigate} />}
    </div>
  );
};

export default LeafAvailablePanel;
