/**
 * Module-level ownership of in-flight study-material generation / recovery.
 * Survives React remounts so Progress can rehydrate; cleared on space switch.
 */

/** Nodes with an in-flight generate/regenerate/improve request (survives node switches). */
const generatingNodeIds = new Set<string>();

/** Nodes currently probing / reattaching an active generation run. */
const recoveringRunIds = new Set<string>();

/**
 * Clear module-level ownership Sets when space study-state is wiped (space switch).
 * Without this, `generatingNodeIds` can block Progress recovery after remount.
 */
export function clearStudyMaterialModuleOwnership(): void {
  generatingNodeIds.clear();
  recoveringRunIds.clear();
}

export function hasGeneratingNode(nodeId: string): boolean {
  return generatingNodeIds.has(nodeId);
}

export function addGeneratingNode(nodeId: string): void {
  generatingNodeIds.add(nodeId);
}

export function deleteGeneratingNode(nodeId: string): void {
  generatingNodeIds.delete(nodeId);
}

export function hasRecoveringRun(nodeId: string): boolean {
  return recoveringRunIds.has(nodeId);
}

export function addRecoveringRun(nodeId: string): void {
  recoveringRunIds.add(nodeId);
}

export function deleteRecoveringRun(nodeId: string): void {
  recoveringRunIds.delete(nodeId);
}
