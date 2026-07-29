import React, { useEffect, useState } from "react";
import type { MixedParentTab, TraineeNodePanelOut } from "../../types/traineeNodePanel.types";
import { useTopicQuizActions } from "../../hooks/useTopicQuizActions";
import TopicDetailReadingView from "./TopicDetailReadingView";
import TopicPanelHeader from "./TopicPanelHeader";
import TopicQuizActions from "./TopicQuizActions";
import SegmentedControl from "./SegmentedControl";
import ProgressBar from "./ProgressBar";
import MaterialPreviewCard from "./MaterialPreviewCard";
import SubtopicList from "./SubtopicList";
import OverallProgressFooter from "./OverallProgressFooter";
import TraineeTopicResourcesPanel from "./TraineeTopicResourcesPanel";

interface MixedParentPanelProps {
  panel: TraineeNodePanelOut;
  spaceId: string;
  nodeId: string;
  onNavigate: (nodeId: string) => void;
  onRefreshPanel: () => void;
  onNodesUnlocked?: (nodeIds: string[]) => void;
}

const MixedParentPanel: React.FC<MixedParentPanelProps> = ({
  panel,
  spaceId,
  nodeId,
  onNavigate,
  onRefreshPanel,
  onNodesUnlocked,
}) => {
  const [activeTab, setActiveTab] = useState<MixedParentTab>(
    panel.default_tab ?? "study"
  );
  const [isReading, setIsReading] = useState(false);

  // Reset reading only when navigating to a different node — not when an
  // unlock refresh flips default_tab to "subtopics".
  useEffect(() => {
    setIsReading(false);
  }, [nodeId]);

  useEffect(() => {
    if (!isReading) {
      setActiveTab(panel.default_tab ?? "study");
    }
  }, [nodeId, panel.default_tab, isReading]);

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
        spaceId={spaceId}
        onBack={() => {
          setIsReading(false);
          onRefreshPanel();
        }}
        onNodesUnlocked={(nodeIds) => {
          // Parent TopicDetailPanel silent-refreshes + tree fetch; do not
          // force a loading refresh that would unmount this reading view.
          onNodesUnlocked?.(nodeIds);
        }}
      />
    );
  }

  return (
    <div className="topic-detail-panel__scroll">
      <TopicPanelHeader
        title={panel.title}
        meta={panel.header_meta}
        breadcrumbs={panel.breadcrumbs}
        backNavigation={panel.back_navigation}
        onNavigate={onNavigate}
      />
      <SegmentedControl
        activeTab={activeTab}
        subtopicCount={panel.subtopics.length}
        onChange={setActiveTab}
      />

      {activeTab === "study" && material && (
        <>
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
        </>
      )}

      {activeTab === "subtopics" && (
        <>
          <SubtopicList subtopics={panel.subtopics} onNavigate={onNavigate} />
          <div className="topic-detail-panel__callout">
            <i className="ti ti-info-circle" aria-hidden="true" style={{ fontSize: 16 }} />
            <span>
              These subtopics go deeper into this section&apos;s material. We recommend
              finishing the reading first.
            </span>
          </div>
        </>
      )}

      <TraineeTopicResourcesPanel
        resources={panel.topic_resources}
        sectionTitle={panel.topic_resources_section_title}
        emptyMessage={panel.topic_resources_empty_message}
      />

      {panel.overall_progress && <OverallProgressFooter progress={panel.overall_progress} />}
    </div>
  );
};

export default MixedParentPanel;
