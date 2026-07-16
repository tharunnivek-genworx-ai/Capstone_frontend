import type { ReactNode } from "react";
import type { EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { InstructionMode } from "./instructionMode.types";

export function getInheritedText(previewParts: EffectiveInstructionPart[]): string | null {
  const inheritedPart = previewParts.find((p) => p.type === "inherited");
  return inheritedPart?.text?.trim() || null;
}

export function getInheritedParts(
  previewParts: EffectiveInstructionPart[]
): EffectiveInstructionPart[] {
  return previewParts.filter((p) => p.type === "inherited");
}

export function getBranchDefaultPart(
  previewParts: EffectiveInstructionPart[]
): EffectiveInstructionPart | undefined {
  return previewParts.find((p) => p.type === "branch-default");
}

export function getExtraPart(
  previewParts: EffectiveInstructionPart[]
): EffectiveInstructionPart | undefined {
  return previewParts.find((p) => p.type === "extra");
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
  if (mode === "extend") return "Default style, plus a topic note";
  return "Custom instruction for this topic only";
}

function quoteInstruction(text: string): ReactNode {
  return <span>&ldquo;{text}&rdquo;</span>;
}

export function buildFromAboveTopicsContent(
  previewParts: EffectiveInstructionPart[],
  mode: InstructionMode,
  onNavigateToNode?: (nodeId: string) => void
): ReactNode {
  const inheritedParts = getInheritedParts(previewParts);

  if (mode === "replace") {
    return (
      <span className="gsm-preview__pval--empty">Ignored for this topic</span>
    );
  }

  if (inheritedParts.length === 0) {
    return (
      <span className="gsm-preview__pval--empty">None set in parent topics</span>
    );
  }

  return (
    <ul className="gsm-preview__inherit-list">
      {inheritedParts.map((part) => (
        <li key={`${part.source_node_id}-${part.type}`} className="gsm-preview__inherit-item">
          <div className="gsm-preview__inherit-text">{quoteInstruction(part.text)}</div>
          {onNavigateToNode ? (
            <button
              type="button"
              className="gsm-preview__inherit-link"
              onClick={() => onNavigateToNode(part.source_node_id)}
            >
              {part.source_node_title}
            </button>
          ) : (
            <span className="gsm-preview__inherit-topic">{part.source_node_title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function buildInstructionPreviewRows(
  mode: InstructionMode,
  modeText: string,
  branchDefault: string,
  previewParts: EffectiveInstructionPart[]
): {
  defaultStyle: ReactNode;
  topicNote: ReactNode;
  override: ReactNode;
} {
  const liveBranchDefault = branchDefault.trim();
  const savedExtra = getExtraPart(previewParts);

  const branchDefaultDisplay = liveBranchDefault ? (
    quoteInstruction(liveBranchDefault)
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
        quoteInstruction(modeText.trim())
      ) : (
        <span className="gsm-preview__pval--empty">Not set — only what you write above applies.</span>
      ),
    };
  }

  const defaultStyle = branchDefaultDisplay;

  const liveTopicNote = modeText.trim();
  const topicNote =
    mode === "extend" && liveTopicNote ? (
      quoteInstruction(liveTopicNote)
    ) : savedExtra?.text?.trim() ? (
      quoteInstruction(savedExtra.text.trim())
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
