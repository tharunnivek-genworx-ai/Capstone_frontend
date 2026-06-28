// InstructionPreviewAccordion.tsx
// Collapsed-by-default accordion that shows a live preview of what the AI will see.
// Updates in real-time as the user types (uses local modeText, not saved state).
import React, { useState } from "react";
import { Eye, ChevronDown } from "lucide-react";
import type { EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { InstructionMode } from "./TeachingLineSelector";

interface InstructionPreviewAccordionProps {
  mode: InstructionMode;
  /** Live local value of the mode-specific text (additive or override) */
  modeText: string;
  /** Live local value of tree_default_instruction for this section */
  branchDefault: string;
  /** Node's effective_instruction_parts from the backend */
  previewParts: EffectiveInstructionPart[];
  /** Root topics have no parent section style — hide that row to avoid confusion */
  isRootTopic?: boolean;
}

export default function InstructionPreviewAccordion({
  mode,
  modeText,
  branchDefault,
  previewParts,
  isRootTopic = false,
}: InstructionPreviewAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const inheritedPart = previewParts.find((p) => p.type === "inherited");
  const liveBranchDefault = branchDefault.trim();

  // Derive the display values based on current local state
  let sectionStyleContent: React.ReactNode;
  let branchDefaultContent: React.ReactNode;
  let topicNoteContent: React.ReactNode;
  let overrideContent: React.ReactNode;

  branchDefaultContent = liveBranchDefault ? (
    <span>&ldquo;{liveBranchDefault}&rdquo;</span>
  ) : (
    <span className="gsm-preview__val--empty">Not set</span>
  );

  if (mode === "replace") {
    // Override mode: section style is ignored
    sectionStyleContent = (
      <span className="gsm-preview__val--empty">Ignored for this topic</span>
    );
    topicNoteContent = (
      <span className="gsm-preview__val--empty">N/A</span>
    );
    overrideContent = modeText.trim() ? (
      <span>&ldquo;{modeText}&rdquo;</span>
    ) : (
      <span className="gsm-preview__val--empty">
        {isRootTopic ? "Not set" : "Not set — section style applies"}
      </span>
    );
  } else {
    // inherit or extend: section style is active
    sectionStyleContent = inheritedPart ? (
      <span>&ldquo;{inheritedPart.text}&rdquo;</span>
    ) : (
      <span className="gsm-preview__val--empty">None set</span>
    );

    topicNoteContent =
      mode === "extend" && modeText.trim() ? (
        <span>&ldquo;{modeText}&rdquo;</span>
      ) : (
        <span className="gsm-preview__val--empty">None added</span>
      );

    overrideContent = (
      <span className="gsm-preview__val--empty">
        {isRootTopic ? "Not set" : "Not set — section style applies"}
      </span>
    );
  }

  return (
    <div className={`gsm-preview${isOpen ? " gsm-preview--open" : ""}`}>
      <button
        type="button"
        className="gsm-preview__head"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="gsm-preview-body"
      >
        <div className="gsm-preview__title">
          <Eye size={14} strokeWidth={2} aria-hidden />
          What AI will see — instruction preview
        </div>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`gsm-preview__chevron${isOpen ? " gsm-preview__chevron--open" : ""}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div id="gsm-preview-body" className="gsm-preview__body" role="region">
          {!isRootTopic && (
            <div className="gsm-preview__row">
              <strong>Section style</strong>
              {sectionStyleContent}
            </div>
          )}
          <div className="gsm-preview__row">
            <strong>Default for subtopics</strong>
            {branchDefaultContent}
          </div>
          <div className="gsm-preview__row">
            <strong>Topic note</strong>
            {topicNoteContent}
          </div>
          <div className="gsm-preview__row">
            <strong>Override</strong>
            {overrideContent}
          </div>
        </div>
      )}
    </div>
  );
}
