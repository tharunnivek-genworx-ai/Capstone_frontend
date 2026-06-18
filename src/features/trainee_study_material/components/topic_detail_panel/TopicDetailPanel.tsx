import React from "react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";
import { useTraineeNodePanel } from "../../hooks/useTraineeNodePanel";
import { getNodePanelType } from "../../utils/nodePanelUtils";
import PureParentPanel from "./PureParentPanel";
import MixedParentPanel from "./MixedParentPanel";
import LeafAvailablePanel from "./LeafAvailablePanel";
import LeafLockedPanel from "./LeafLockedPanel";

interface TopicDetailPanelProps {
  node: NodeTreeNode;
  spaceId: string;
  onNavigate: (nodeId: string) => void;
}

const TopicDetailPanel: React.FC<TopicDetailPanelProps> = ({ node, spaceId, onNavigate }) => {
  const { panel, isLoading, loadError, refresh } = useTraineeNodePanel({ nodeId: node.node_id });
  const panelType = panel?.panel_type ?? getNodePanelType(node);

  if (isLoading) {
    return (
      <div className="topic-detail-panel topic-detail-panel__loading">
        <span className="spinner" />
        <p>Loading topic details…</p>
      </div>
    );
  }

  if (loadError || !panel) {
    return (
      <div className="topic-detail-panel topic-detail-panel--empty">
        <p>{loadError ?? "Could not load topic details."}</p>
      </div>
    );
  }

  switch (panelType) {
    case "pure-parent":
      return (
        <div className="topic-detail-panel">
          <PureParentPanel panel={panel} onNavigate={onNavigate} />
        </div>
      );
    case "mixed-parent":
      return (
        <div className="topic-detail-panel">
          <MixedParentPanel
            panel={panel}
            spaceId={spaceId}
            nodeId={node.node_id}
            onNavigate={onNavigate}
            onRefreshPanel={() => {
              void refresh();
            }}
          />
        </div>
      );
    case "leaf-available":
      return (
        <div className="topic-detail-panel">
          <LeafAvailablePanel
            panel={panel}
            spaceId={spaceId}
            nodeId={node.node_id}
            onNavigate={onNavigate}
            onRefreshPanel={() => {
              void refresh();
            }}
          />
        </div>
      );
    case "leaf-locked":
      return (
        <div className="topic-detail-panel">
          <LeafLockedPanel panel={panel} onNavigate={onNavigate} />
        </div>
      );
    default:
      return null;
  }
};

export default TopicDetailPanel;
