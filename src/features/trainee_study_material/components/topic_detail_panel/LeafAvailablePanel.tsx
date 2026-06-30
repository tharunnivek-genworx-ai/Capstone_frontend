import React, { useEffect, useState } from "react";
import type { MaterialTab, TraineeNodePanelOut } from "../../types/traineeNodePanel.types";
import { useTopicQuizActions } from "../../hooks/useTopicQuizActions";
import TopicDetailReadingView from "./TopicDetailReadingView";
import TopicPanelHeader from "./TopicPanelHeader";
import TopicQuizActions from "./TopicQuizActions";
import ProgressBar from "./ProgressBar";
import MaterialPreviewCard from "./MaterialPreviewCard";
import WhatsNextCard from "./WhatsNextCard";
import TraineeTopicResourcesPanel from "./TraineeTopicResourcesPanel";
import MaterialVersionTabs from "./MaterialVersionTabs";
import PreviousVersionsPanel from "./PreviousVersionsPanel";
import ArchivedStudyMaterialReader from "./ArchivedStudyMaterialReader";

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
  const [materialTab, setMaterialTab] = useState<MaterialTab>("current");
  const [archivedRead, setArchivedRead] = useState<{
    versionId: string;
    isCurrentVersion: boolean;
  } | null>(null);

  const material = panel.study_material;
  const hasArchive = (panel.archive_summary?.archived_version_count ?? 0) > 0;
  const quizHandlers = useTopicQuizActions({
    spaceId,
    nodeId,
    quizActions: material?.quiz_actions,
  });

  useEffect(() => {
    setMaterialTab("current");
    setIsReading(false);
    setArchivedRead(null);
  }, [nodeId]);

  if (archivedRead) {
    return (
      <ArchivedStudyMaterialReader
        nodeId={nodeId}
        versionId={archivedRead.versionId}
        nodeTitle={panel.title}
        isCurrentVersion={archivedRead.isCurrentVersion}
        onBack={() => setArchivedRead(null)}
      />
    );
  }

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

      {hasArchive && (
        <MaterialVersionTabs
          activeTab={materialTab}
          previousCount={panel.archive_summary?.archived_version_count ?? 0}
          onChange={setMaterialTab}
        />
      )}

      {materialTab === "previous" && hasArchive ? (
        <PreviousVersionsPanel
          nodeId={nodeId}
          spaceId={spaceId}
          nodeTitle={panel.title}
          onReadVersion={(version) =>
            setArchivedRead({
              versionId: version.version_id,
              isCurrentVersion: version.is_current_version ?? false,
            })
          }
        />
      ) : (
        <>
          {panel.archive_summary?.show_upgrade_banner && (
            <div className="topic-detail-panel__upgrade-banner" role="status">
              <i className="ti ti-info-circle" aria-hidden="true" />
              Material updated — previous version available for reference.
            </div>
          )}

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

          <TraineeTopicResourcesPanel
            resources={panel.topic_resources}
            sectionTitle={panel.topic_resources_section_title}
            emptyMessage={panel.topic_resources_empty_message}
          />

          {panel.next_up && <WhatsNextCard nextUp={panel.next_up} onNavigate={onNavigate} />}
        </>
      )}
    </div>
  );
};

export default LeafAvailablePanel;
