import { generationJobService } from "../../generation/services/generationProgressService";
import {
  patchForGenerationJobFailure,
  patchForGenerationJobPaused,
} from "../../generation/utils/generationRunState";
import { GenerationJobFailedError } from "../../generation/utils/generationJobErrors";
import type { NodeStudyStatePatch } from "../types/studyMaterial.types";
import { deleteGeneratingNode } from "./studyMaterialRunOwnership";

export type UnresolvedRunRouteDeps = {
  patchNodeStudyState: (nodeId: string, patch: NodeStudyStatePatch) => void;
  isViewingNode: (nodeId: string) => boolean;
  setProcessingLabel: (label: string | null) => void;
};

/**
 * Backend-truth guard: an unresolved paused or failed run must be resumed or
 * deleted explicitly — never silently superseded by a fresh generate.
 * Returns true when such a run exists so callers abort.
 */
export async function routeToUnresolvedStudyMaterialRun(
  nodeId: string,
  deps: UnresolvedRunRouteDeps,
): Promise<boolean> {
  try {
    const active = await generationJobService.getActiveRun(nodeId, "study_material");
    if (active?.run_id && active.status === "paused") {
      deleteGeneratingNode(nodeId);
      deps.patchNodeStudyState(nodeId, {
        currentPage: 2,
        hasTriggeredGeneration: true,
        ...patchForGenerationJobPaused(active.run_id, "study_material"),
      });
      if (deps.isViewingNode(nodeId)) {
        deps.setProcessingLabel(null);
      }
      return true;
    }
    if (active?.run_id && active.status === "failed") {
      deleteGeneratingNode(nodeId);
      deps.patchNodeStudyState(nodeId, {
        currentPage: 2,
        hasTriggeredGeneration: true,
        ...patchForGenerationJobFailure(
          new GenerationJobFailedError("Generation failed.", active.run_id),
          active.run_id,
          "study_material",
        ),
      });
      if (deps.isViewingNode(nodeId)) {
        deps.setProcessingLabel(null);
      }
      return true;
    }
  } catch {
    /* non-critical — fall through and let the normal generate path proceed */
  }
  return false;
}
