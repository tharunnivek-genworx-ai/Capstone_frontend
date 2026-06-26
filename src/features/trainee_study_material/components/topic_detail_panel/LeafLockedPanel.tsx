import React, { useEffect, useState } from "react";
import type { MaterialTab, TraineeNodePanelOut } from "../../types/traineeNodePanel.types";
import TopicPanelHeader from "./TopicPanelHeader";
import ComingSoonBanner from "./ComingSoonBanner";
import TraineeTopicResourcesPanel from "./TraineeTopicResourcesPanel";
import MaterialVersionTabs from "./MaterialVersionTabs";
import PreviousVersionsPanel from "./PreviousVersionsPanel";
import ArchivedStudyMaterialReader from "./ArchivedStudyMaterialReader";

interface LeafLockedPanelProps {
  panel: TraineeNodePanelOut;
  spaceId: string;
  nodeId: string;
  onNavigate: (nodeId: string) => void;
}

const LeafLockedPanel: React.FC<LeafLockedPanelProps> = ({
  panel,
  spaceId,
  nodeId,
  onNavigate,
}) => {
  const [materialTab, setMaterialTab] = useState<MaterialTab>("current");
  const [archivedRead, setArchivedRead] = useState<{
    versionId: string;
    versionLabel: string;
  } | null>(null);

  const hasArchive = (panel.archive_summary?.archived_version_count ?? 0) > 0;

  useEffect(() => {
    setMaterialTab("current");
    setArchivedRead(null);
  }, [nodeId]);

  if (archivedRead) {
    return (
      <ArchivedStudyMaterialReader
        nodeId={nodeId}
        versionId={archivedRead.versionId}
        nodeTitle={panel.title}
        versionLabel={archivedRead.versionLabel}
        onBack={() => setArchivedRead(null)}
      />
    );
  }

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
          onReadVersion={(versionId, versionLabel) =>
            setArchivedRead({ versionId, versionLabel })
          }
        />
      ) : (
        <>
          <ComingSoonBanner
            siblingSuggestions={panel.sibling_suggestions}
            onNavigate={onNavigate}
          />
          <TraineeTopicResourcesPanel
            resources={panel.topic_resources}
            sectionTitle={panel.topic_resources_section_title}
            emptyMessage={panel.topic_resources_empty_message}
          />
        </>
      )}
    </div>
  );
};

export default LeafLockedPanel;
