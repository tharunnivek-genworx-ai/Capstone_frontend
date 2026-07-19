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
  onNodesUnlocked?: (nodeIds: string[]) => void;
}

const TopicDetailPanel: React.FC<TopicDetailPanelProps> = ({
  node,
  spaceId,
  onNavigate,
  onNodesUnlocked,
}) => {
  const { panel, isLoading, loadError, refresh } = useTraineeNodePanel({ nodeId: node.node_id });
  const panelType = panel?.panel_type ?? getNodePanelType(node);

  const handleNodesUnlocked = (nodeIds: string[]) => {
    onNodesUnlocked?.(nodeIds);
    void refresh();
  };

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

  if (panel.access_status === "prerequisite_locked") {
    return (
      <div className="topic-detail-panel">
        <LeafLockedPanel
          panel={panel}
          spaceId={spaceId}
          nodeId={node.node_id}
          onNavigate={onNavigate}
        />
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
            onNodesUnlocked={handleNodesUnlocked}
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
            onNodesUnlocked={handleNodesUnlocked}
          />
        </div>
      );
    case "leaf-locked":
      return (
        <div className="topic-detail-panel">
          <LeafLockedPanel
            panel={panel}
            spaceId={spaceId}
            nodeId={node.node_id}
            onNavigate={onNavigate}
          />
        </div>
      );
    default:
      return null;
  }
};

export default TopicDetailPanel;
