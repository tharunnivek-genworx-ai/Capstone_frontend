import type { ReactNode } from "react";
import type { EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { InstructionMode } from "./instructionMode.types";

export function getInheritedText(previewParts: EffectiveInstructionPart[]): string | null {
  const inheritedPart = previewParts.find(
    (p) => p.type === "inherited" || p.type === "branch-default"
  );
  return inheritedPart?.text?.trim() || null;
}

export function buildRailQuote(
  mode: InstructionMode,
  modeText: string,
  previewParts: EffectiveInstructionPart[]
): string {
  const inherited = getInheritedText(previewParts);
  const standardText = inherited ? `"${inherited}"` : "No section default style set yet.";

  if (mode === "inherit") {
    return standardText;
  }

  if (mode === "extend") {
    const note = modeText.trim();
    return note
      ? `${standardText} + "${note}"`
      : `${standardText} (add your note below)`;
  }

  const custom = modeText.trim();
  return custom
    ? `"${custom}"`
    : "Write your own instructions below — this will replace the default style.";
}

export function getApproachSummary(mode: InstructionMode): string {
  if (mode === "inherit") return "Using the section's default style";
  if (mode === "extend") return "Default style, plus a quick note";
  return "Write instructions just for this topic";
}

export function buildInstructionPreviewRows(
  mode: InstructionMode,
  modeText: string,
  branchDefault: string,
  previewParts: EffectiveInstructionPart[],
  isRootTopic: boolean
): {
  defaultStyle: ReactNode;
  topicNote: ReactNode;
  override: ReactNode;
} {
  const inheritedPart = previewParts.find(
    (p) => p.type === "inherited" || p.type === "branch-default"
  );
  const liveBranchDefault = branchDefault.trim();

  const branchDefaultDisplay = liveBranchDefault ? (
    <span>&ldquo;{liveBranchDefault}&rdquo;</span>
  ) : (
    <span className="gsm-preview__pval--empty">Not set</span>
  );

  if (mode === "replace") {
    return {
      defaultStyle: (
        <span className="gsm-preview__pval--empty">Ignored for this topic</span>
      ),
      topicNote: (
        <span className="gsm-preview__pval--empty">
          Not added yet — using the default style only.
        </span>
      ),
      override: modeText.trim() ? (
        <span>&ldquo;{modeText}&rdquo;</span>
      ) : (
        <span className="gsm-preview__pval--empty">Not set — using the style above.</span>
      ),
    };
  }

  const defaultStyle = isRootTopic
    ? branchDefaultDisplay
    : inheritedPart ? (
        <span>&ldquo;{inheritedPart.text}&rdquo;</span>
      ) : (
        <span className="gsm-preview__pval--empty">Not set</span>
      );

  const topicNote =
    mode === "extend" && modeText.trim() ? (
      <span>&ldquo;{modeText}&rdquo;</span>
    ) : (
      <span className="gsm-preview__pval--empty">
        Not added yet — using the default style only.
      </span>
    );

  const override = (
    <span className="gsm-preview__pval--empty">Not set — using the style above.</span>
  );

  return { defaultStyle, topicNote, override };
}
