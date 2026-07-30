import type { InstructionMode } from "./instructionMode.types";
import type { NodeTreeNode } from "../../../spaces/types/node.types";

/** Whether the section default should apply for this topic (toggle ON). */
export function applyDefaultFromMode(mode: InstructionMode): boolean {
  return mode !== "replace";
}

/** Read the saved instruction mode from node (prefer API field; fall back to columns). */
export function detectInstructionModeFromNode(node: NodeTreeNode): InstructionMode {
  if (node.instruction_mode != null) return node.instruction_mode;
  if (node.node_specific_instruction != null) return "replace";
  if ((node.node_additive_instruction ?? "").trim()) return "extend";
  return "inherit";
}

/** Saved topic instruction text for the given mode. */
export function getSavedInstructionText(
  node: NodeTreeNode,
  savedMode: InstructionMode
): string {
  if (savedMode === "replace") return (node.node_specific_instruction ?? "").trim();
  if (savedMode === "extend") return (node.node_additive_instruction ?? "").trim();
  return "";
}

/** Whether topic-level instruction UI differs from what is saved on the node. */
export function isApproachDirty(
  node: NodeTreeNode,
  mode: InstructionMode,
  modeText: string
): boolean {
  const savedMode = detectInstructionModeFromNode(node);
  if (mode !== savedMode) return true;
  return modeText.trim() !== getSavedInstructionText(node, savedMode);
}

/**
 * Derive API instruction mode from toggle + topic text.
 * - Toggle ON, empty text → inherit (section default only)
 * - Toggle ON, with text → extend (default + note)
 * - Toggle OFF, with text → replace (override)
 * - Toggle OFF, empty text → replace (ignore section defaults; saveable empty override)
 */
export function deriveInstructionMode(
  applyDefault: boolean,
  text: string
): InstructionMode {
  const trimmed = text.trim();
  if (!trimmed) return applyDefault ? "inherit" : "replace";
  return applyDefault ? "extend" : "replace";
}
