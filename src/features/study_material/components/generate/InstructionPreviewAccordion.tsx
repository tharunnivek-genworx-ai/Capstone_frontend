import { useState } from "react";
import { ChevronDown, Eye, Shield } from "lucide-react";
import type { EffectiveInstructionPart } from "../../../spaces/types/node.types";
import type { InstructionMode } from "./instructionMode.types";
import { buildFromAboveTopicsContent, buildInstructionPreviewRows } from "./instructionPreviewContent";

interface InstructionPreviewAccordionProps {
  mode: InstructionMode;
  modeText: string;
  branchDefault: string;
  previewParts: EffectiveInstructionPart[];
  isRootTopic?: boolean;
  embedded?: boolean;
  hasUnsavedChanges?: boolean;
  generationSourceTitle?: string | null;
  learnerResourceCount?: number;
  onNavigateToNode?: (nodeId: string) => void;
}

export default function InstructionPreviewAccordion({
  mode,
  modeText,
  branchDefault,
  previewParts,
  isRootTopic = false,
  embedded = false,
  hasUnsavedChanges = false,
  generationSourceTitle = null,
  learnerResourceCount = 0,
  onNavigateToNode,
}: InstructionPreviewAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { defaultStyle: defaultStyleContent, topicNote: topicNoteContent, override: overrideContent } =
    buildInstructionPreviewRows(mode, modeText, branchDefault, previewParts);

  const fromAboveTopicsContent = !isRootTopic
    ? buildFromAboveTopicsContent(previewParts, mode, onNavigateToNode)
    : null;

  const previewBody = (
    <div id="gsm-preview-body" className="gsm-preview__body" role="region">
      {!isRootTopic && (
        <div className="gsm-preview__row">
          <div className="gsm-preview__plabel">From the above topics</div>
          <div className="gsm-preview__pval">{fromAboveTopicsContent}</div>
        </div>
      )}
      <div className="gsm-preview__row">
        <div className="gsm-preview__plabel">Default style (whole section)</div>
        <div className="gsm-preview__pval">{defaultStyleContent}</div>
      </div>
      <div className="gsm-preview__row">
        <div className="gsm-preview__plabel">Your note for this topic</div>
        <div className="gsm-preview__pval">{topicNoteContent}</div>
      </div>
      <div className="gsm-preview__row">
        <div className="gsm-preview__plabel">Custom override</div>
        <div className="gsm-preview__pval">{overrideContent}</div>
      </div>
      <div className="gsm-preview__row">
        <div className="gsm-preview__plabel">Generation source</div>
        <div className={`gsm-preview__pval${generationSourceTitle ? "" : " gsm-preview__pval--empty"}`}>
          {generationSourceTitle ?? "No source document selected"}
        </div>
      </div>
      <div className="gsm-preview__row">
        <div className="gsm-preview__plabel">Student resources</div>
        <div className="gsm-preview__pval gsm-preview__pval--empty">
          {learnerResourceCount > 0
            ? `${learnerResourceCount} resource${learnerResourceCount === 1 ? "" : "s"} excluded from AI context`
            : "None — student resources are never added to AI context automatically"}
        </div>
      </div>
      <p className="gsm-preview__footnote">
        <Shield size={13} strokeWidth={1.8} aria-hidden />
        {hasUnsavedChanges
          ? "Preview includes unsaved edits. Save them before generation so the backend receives this configuration."
          : "This is the saved instruction and source configuration the next generation run will use."}
      </p>
    </div>
  );

  if (embedded) {
    return (
      <details
        className={`gsm-preview gsm-preview--embedded${isOpen ? " gsm-preview--open" : ""}`}
        onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="gsm-preview__head gsm-preview__head--embedded">
          <div className="gsm-card__head-left">
            <div className="gsm-card__icon gsm-card__icon--muted" aria-hidden="true">
              <Eye size={16} strokeWidth={1.8} />
            </div>
            <div>
              <span className="gsm-preview__summary-title">Preview what AI will use</span>
              <span className="gsm-preview__acc-sub">Optional — for the curious</span>
            </div>
          </div>
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className="gsm-preview__chevron"
            aria-hidden
          />
        </summary>
        {previewBody}
      </details>
    );
  }

  return (
    <section className={`gsm-card gsm-preview${isOpen ? " gsm-preview--open" : ""}`}>
      <button
        type="button"
        className="gsm-preview__head"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="gsm-preview-body"
      >
        <div className="gsm-card__head-left">
          <div className="gsm-card__icon gsm-card__icon--muted" aria-hidden="true">
            <Eye size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="gsm-card__title">See exactly what AI will use</h3>
            <p className="gsm-preview__acc-sub">For the curious — totally optional</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className="gsm-preview__chevron"
          aria-hidden
        />
      </button>

      {isOpen && previewBody}
    </section>
  );
}
