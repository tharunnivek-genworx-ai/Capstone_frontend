/** Cross-route signal when durable unlocks are granted mid-session. */

export const TRAINEE_NODES_UNLOCKED_EVENT = "trainee-nodes-unlocked";

export interface TraineeNodesUnlockedDetail {
  spaceId: string;
  nodeIds: string[];
}

export function notifyNodesUnlocked(spaceId: string, nodeIds: string[]): void {
  if (!spaceId || nodeIds.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<TraineeNodesUnlockedDetail>(TRAINEE_NODES_UNLOCKED_EVENT, {
      detail: { spaceId, nodeIds },
    }),
  );
}
