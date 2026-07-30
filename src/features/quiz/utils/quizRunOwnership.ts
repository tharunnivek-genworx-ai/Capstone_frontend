/**
 * Module-level ownership of in-flight quiz / hints generation.
 * Survives React remounts across node switches within a space session.
 */

const generatingQuizNodeIds = new Set<string>();
const generatingHintsNodeIds = new Set<string>();

export function hasGeneratingQuizNode(nodeId: string): boolean {
  return generatingQuizNodeIds.has(nodeId);
}

export function addGeneratingQuizNode(nodeId: string): void {
  generatingQuizNodeIds.add(nodeId);
}

export function deleteGeneratingQuizNode(nodeId: string): void {
  generatingQuizNodeIds.delete(nodeId);
}

export function hasGeneratingHintsNode(nodeId: string): boolean {
  return generatingHintsNodeIds.has(nodeId);
}

export function addGeneratingHintsNode(nodeId: string): void {
  generatingHintsNodeIds.add(nodeId);
}

export function deleteGeneratingHintsNode(nodeId: string): void {
  generatingHintsNodeIds.delete(nodeId);
}
