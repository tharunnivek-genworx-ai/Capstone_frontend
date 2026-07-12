import type { InstructionMode } from "./instructionMode.types";

/** Whether the section default should apply for this topic (toggle ON). */
export function applyDefaultFromMode(mode: InstructionMode): boolean {
  return mode !== "replace";
}

/**
 * Derive API instruction mode from toggle + topic text.
 * - Toggle ON, empty text → inherit (section default only)
 * - Toggle ON, with text → extend (default + note)
 * - Toggle OFF, with text → replace (override)
 * - Toggle OFF, empty text → inherit (no custom instruction yet)
 */
export function deriveInstructionMode(
  applyDefault: boolean,
  text: string
): InstructionMode {
  const trimmed = text.trim();
  if (!trimmed) return "inherit";
  return applyDefault ? "extend" : "replace";
}
