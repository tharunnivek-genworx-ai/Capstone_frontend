// InstructionContextPanel.tsx
import type { EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { InstructionMode } from "./TeachingLineSelector";

interface InstructionContextPanelProps {
  id?: string;
  mode: InstructionMode;
  /** Live local value of the mode-specific text (additive or override) */
  modeText: string;
  onChange: (text: string) => void;
  /** Node's effective_instruction_parts array */
  previewParts: EffectiveInstructionPart[];
  /** Navigate to the node that owns the inherited instruction */
  onNavigateToNode: (nodeId: string) => void;
}

export default function InstructionContextPanel({
  id,
  mode,
  modeText,
  onChange,
  previewParts,
  onNavigateToNode,
}: InstructionContextPanelProps) {
  // The inherited / branch-default part is the "section style" the parent set
  const inheritedPart = previewParts.find(
    (p) => p.type === "inherited" || p.type === "branch-default"
  );

  // ── inherit mode ────────────────────────────────────────────────────────
  if (mode === "inherit") {
    if (!inheritedPart) {
      return (
        <div id={id} className="gsm-context">
          <p className="gsm-context__empty">
            No section style set yet — AI will use its default approach. You can set a
            subtopic default above or add your own instructions using the options above.
          </p>
        </div>
      );
    }

    return (
      <div id={id} className="gsm-context">
        <div className="gsm-inherited-card">
          <div className="gsm-inherited-card__bar" aria-hidden="true" />
          <div className="gsm-inherited-card__body">
            <div className="gsm-inherited-card__label">AI will follow this instruction</div>
            <div className="gsm-inherited-card__text">
              &ldquo;{inheritedPart.text}&rdquo;
            </div>
            <div className="gsm-inherited-card__source">
              Set on{" "}
              <button
                type="button"
                className="gsm-link-btn"
                onClick={() => onNavigateToNode(inheritedPart.source_node_id)}
                title={`Navigate to: ${inheritedPart.source_node_title}`}
              >
                {inheritedPart.source_node_title}
              </button>{" "}
              — applies to all topics in this section unless you override it.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── extend mode ─────────────────────────────────────────────────────────
  if (mode === "extend") {
    return (
      <div id={id} className="gsm-context">
        {inheritedPart && (
          <div className="gsm-inherited-strip">
            <span className="gsm-inherited-strip__label">Section style:</span>
            <span className="gsm-inherited-strip__val">
              &ldquo;{inheritedPart.text}&rdquo;
            </span>
          </div>
        )}

        <label className="gsm-textarea-label" htmlFor="gsm-extend-textarea">
          Your extra note for this topic only
        </label>
        <textarea
          id="gsm-extend-textarea"
          className="gsm-textarea"
          rows={3}
          value={modeText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Include one real-world coding example to illustrate the concepts."
        />
        <p className="gsm-textarea-hint">
          This note only applies here — it won&apos;t affect other topics in this section.
        </p>
      </div>
    );
  }

  // ── replace mode ────────────────────────────────────────────────────────
  return (
    <div id={id} className="gsm-context">
      <label className="gsm-textarea-label" htmlFor="gsm-replace-textarea">
        Instructions for this topic
      </label>
      <textarea
        id="gsm-replace-textarea"
        className="gsm-textarea"
        rows={4}
        value={modeText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Focus on Agile and Scrum only — skip Waterfall. Include a comparison table of Agile vs Scrum."
      />
      <p className="gsm-textarea-hint">
        The section style is ignored for this topic. Only what you write above is used.
      </p>
    </div>
  );
}
