import { studyMaterialService } from "../services/studyMaterialService";
import type {
  NodeStudyStatePatch,
  StudyMaterialMentorUiStateOut,
} from "../types/studyMaterial.types";

export type MentorUiSyncDeps = {
  viewingVersionId: string | null;
  mentorUiStateByNode: Map<string, StudyMaterialMentorUiStateOut>;
  mentorUiFetchedNodeIds: Set<string>;
  isViewingNode: (nodeId: string) => boolean;
  applyMentorUiState: (nodeId: string, state: StudyMaterialMentorUiStateOut | null) => void;
  patchNodeStudyState: (nodeId: string, patch: NodeStudyStatePatch) => void;
  setIsLoadingMentorUiState: (loading: boolean) => void;
};

/**
 * Fetch mentor UI state, update per-node cache, and apply to React state when viewing.
 * Behavior-preserving extract of refreshMentorUiState body.
 */
export async function refreshMentorUiStateForNode(
  nodeId: string,
  viewingId: string | null | undefined,
  deps: MentorUiSyncDeps,
): Promise<void> {
  deps.setIsLoadingMentorUiState(true);
  try {
    const state = await studyMaterialService.getMentorUiState(
      nodeId,
      viewingId ?? deps.viewingVersionId,
    );
    deps.mentorUiStateByNode.set(nodeId, state);
    deps.mentorUiFetchedNodeIds.add(nodeId);
    if (deps.isViewingNode(nodeId)) {
      deps.applyMentorUiState(nodeId, state);
    }
    if (state.has_versions) {
      deps.patchNodeStudyState(nodeId, { hasTriggeredGeneration: true });
    } else {
      deps.patchNodeStudyState(nodeId, {
        hasTriggeredGeneration: false,
        studyMaterialContent: null,
        activeVersion: null,
      });
    }
  } catch {
    if (deps.isViewingNode(nodeId)) {
      // Keep per-node cache so a transient failure does not grey out Material.
      deps.applyMentorUiState(nodeId, deps.mentorUiStateByNode.get(nodeId) ?? null);
    }
  } finally {
    if (deps.isViewingNode(nodeId)) {
      deps.setIsLoadingMentorUiState(false);
    }
  }
}
