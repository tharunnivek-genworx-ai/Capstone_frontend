import { forwardRef, useCallback } from "react";
import { ChevronDown, Link2, Pencil, Sparkles, StickyNote } from "lucide-react";
import type { InstructionMode } from "./instructionMode.types";
import { getApproachSummary } from "./instructionPreviewContent";

interface ApproachOption {
  mode: InstructionMode;
  Icon: typeof Link2;
  title: string;
  caption: string;
  recommended?: boolean;
}

const APPROACH_OPTIONS: ApproachOption[] = [
  {
    mode: "inherit",
    Icon: Link2,
    title: "Use the section's default style",
    caption:
      "Teaches this topic exactly the same way as the rest of this section.",
    recommended: true,
  },
  {
    mode: "extend",
    Icon: StickyNote,
    title: "Default style, plus a quick note",
    caption:
      "Keeps the default style, and adds one extra instruction just for this topic.",
  },
  {
    mode: "replace",
    Icon: Pencil,
    title: "Write instructions just for this topic",
    caption:
      "Sets aside the default style and uses only what you write below, for this topic only.",
  },
];

interface ApproachChooserProps {
  nodeTitle: string;
  mode: InstructionMode;
  modeText: string;
  onModeChange: (mode: InstructionMode) => void;
  onModeTextChange: (text: string) => void;
  isApproachDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const ApproachChooser = forwardRef<HTMLElement, ApproachChooserProps>(
  function ApproachChooser(
    {
      nodeTitle,
      mode,
      modeText,
      onModeChange,
      onModeTextChange,
      isApproachDirty,
      isSaving,
      onSave,
      onDiscard,
      isExpanded,
      onExpandedChange,
    },
    ref
  ) {
    const handleSelectMode = useCallback(
      (nextMode: InstructionMode) => {
        onModeChange(nextMode);
        if (nextMode === "extend" || nextMode === "replace") {
          setTimeout(() => {
            const textareaId =
              nextMode === "extend" ? "gsm-extend-textarea" : "gsm-replace-textarea";
            document.getElementById(textareaId)?.focus();
          }, 50);
        }
      },
      [onModeChange]
    );

    const handleCardKeyDown = (
      e: React.KeyboardEvent,
      nextMode: InstructionMode
    ) => {
      if (e.key === "Enter" || e.key === " ") {
        if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
        e.preventDefault();
        handleSelectMode(nextMode);
      }
    };

    const selectedSummary = getApproachSummary(mode);
    const notePreview =
      mode !== "inherit" && modeText.trim()
        ? ` — "${modeText.trim().slice(0, 48)}${modeText.trim().length > 48 ? "…" : ""}"`
        : "";

    return (
      <section
        className={`gsm-card gsm-card--collapsible${isExpanded ? " gsm-card--open" : ""}`}
        id="gsm-approach-card"
        ref={ref}
      >
        <button
          type="button"
          className="gsm-card__toggle"
          onClick={() => onExpandedChange(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="gsm-approach-body"
        >
          <div className="gsm-card__head-left">
            <div className="gsm-card__icon" aria-hidden="true">
              <Sparkles size={18} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="gsm-card__title">Choose how AI should teach this topic</h3>
              {!isExpanded && (
                <p className="gsm-card__collapsed-hint">
                  {selectedSummary}
                  {notePreview}
                  {isApproachDirty && (
                    <span className="gsm-card__dirty-dot" title="Unsaved changes" />
                  )}
                </p>
              )}
              {isExpanded && (
                <p className="gsm-card__sub">
                  This shapes the tone, depth, and style of the lesson AI writes.
                </p>
              )}
            </div>
          </div>
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className="gsm-card__chevron"
            aria-hidden
          />
        </button>

        {isExpanded && (
          <div id="gsm-approach-body" className="gsm-card__body">
            <div
              className="gsm-approach-list"
              role="radiogroup"
              aria-label="Teaching approach for this topic"
            >
              {APPROACH_OPTIONS.map(({ mode: optionMode, Icon, title, caption, recommended }) => {
                const isSelected = mode === optionMode;
                return (
                  <div
                    key={optionMode}
                    className={`gsm-approach-card${isSelected ? " gsm-approach-card--selected" : ""}`}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
                      handleSelectMode(optionMode);
                    }}
                    onKeyDown={(e) => handleCardKeyDown(e, optionMode)}
                  >
                    <span className="gsm-radio-dot" aria-hidden="true" />
                    <span className="gsm-approach-icon" aria-hidden="true">
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <div className="gsm-approach-body">
                      <div className="gsm-approach-title-row">
                        <b>{title}</b>
                        {recommended && (
                          <span className="gsm-pill-recommended">Recommended</span>
                        )}
                      </div>
                      <p className="gsm-approach-caption">{caption}</p>

                      {isSelected && optionMode === "extend" && (
                        <div className="gsm-approach-extra">
                          <label className="gsm-field-label" htmlFor="gsm-extend-textarea">
                            Your note for {nodeTitle}
                          </label>
                          <textarea
                            id="gsm-extend-textarea"
                            className="gsm-field"
                            rows={3}
                            value={modeText}
                            onChange={(e) => onModeTextChange(e.target.value)}
                            placeholder="e.g. Include one real-world coding example to illustrate the concepts."
                            onClick={(e) => e.stopPropagation()}
                          />
                          <p className="gsm-field-help">
                            This note only applies to {nodeTitle} — it won&apos;t change
                            other topics.
                          </p>
                        </div>
                      )}

                      {isSelected && optionMode === "replace" && (
                        <div className="gsm-approach-extra">
                          <label className="gsm-field-label" htmlFor="gsm-replace-textarea">
                            Your custom instructions for this topic
                          </label>
                          <textarea
                            id="gsm-replace-textarea"
                            className="gsm-field"
                            rows={4}
                            value={modeText}
                            onChange={(e) => onModeTextChange(e.target.value)}
                            placeholder={`Describe exactly how AI should approach ${nodeTitle}…`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <p className="gsm-field-help gsm-field-help--warn">
                            Heads up — this replaces the default style for this topic only.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`gsm-save-bar${isApproachDirty ? " gsm-save-bar--visible" : ""}`}
            >
              <div className="gsm-unsaved-note">
                <span className="gsm-unsaved-note__dot" aria-hidden="true" />
                You have unsaved changes to this topic
              </div>
              <div className="gsm-save-bar__btns">
                <button
                  type="button"
                  className="gsm-btn gsm-btn--ghost"
                  onClick={onDiscard}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="gsm-btn gsm-btn--primary"
                  onClick={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    "Save this approach"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
);

export default ApproachChooser;
