import React from "react";
import type { TraineeNodePanelOut } from "../../types/traineeNodePanel.types";
import TopicPanelHeader from "./TopicPanelHeader";
import SubtopicList from "./SubtopicList";
import OverallProgressFooter from "./OverallProgressFooter";

interface PureParentPanelProps {
  panel: TraineeNodePanelOut;
  onNavigate: (nodeId: string) => void;
}

const PureParentPanel: React.FC<PureParentPanelProps> = ({ panel, onNavigate }) => {
  if (panel.all_subtopics_locked) {
    return (
      <div className="topic-detail-panel__scroll">
        <TopicPanelHeader
          title={panel.title}
          meta={panel.header_meta}
          breadcrumbs={panel.breadcrumbs}
          backNavigation={panel.back_navigation}
          onNavigate={onNavigate}
        />
        <div className="topic-detail-panel__empty-state">
          <div className="topic-detail-panel__empty-state-icon">
            <i className="ti ti-file-text" aria-hidden="true" />
          </div>
          <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>Content coming soon</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            Your mentor is still preparing material for this section.
          </p>
        </div>
      </div>
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
      <h3 className="topic-detail-panel__heading">Choose where to start</h3>
      {panel.availability_summary && (
        <p className="topic-detail-panel__summary">{panel.availability_summary}</p>
      )}
      <SubtopicList subtopics={panel.subtopics} onNavigate={onNavigate} />
      {panel.children_progress_label && (
        <p className="topic-detail-panel__summary">{panel.children_progress_label}</p>
      )}
      {panel.overall_progress && <OverallProgressFooter progress={panel.overall_progress} />}
    </div>
  );
};

export default PureParentPanel;
