import { forwardRef, useCallback, useEffect, useState } from "react";
import type { InstructionMode } from "./instructionMode.types";
import {
  applyDefaultFromMode,
  deriveInstructionMode,
} from "./instructionModeUtils";

const INSTRUCTION_LIMIT = 1000;

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
  embedded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
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
      embedded = false,
    },
    ref
  ) {
    const [applyDefault, setApplyDefault] = useState(() =>
      applyDefaultFromMode(mode)
    );

    useEffect(() => {
      setApplyDefault(applyDefaultFromMode(mode));
    }, [mode, nodeTitle]);

    const syncMode = useCallback(
      (nextApplyDefault: boolean, nextText: string) => {
        onModeChange(deriveInstructionMode(nextApplyDefault, nextText));
      },
      [onModeChange]
    );

    const handleToggleChange = useCallback(
      (checked: boolean) => {
        setApplyDefault(checked);
        syncMode(checked, modeText);
      },
      [modeText, syncMode]
    );

    const handleTextChange = useCallback(
      (text: string) => {
        onModeTextChange(text);
        syncMode(applyDefault, text);
      },
      [applyDefault, onModeTextChange, syncMode]
    );

    const body = (
      <>
        <div className="gsm-approach-simple">
          <label className="gsm-approach-toggle-row">
            <input
              type="checkbox"
              className="gsm-approach-toggle-input"
              checked={applyDefault}
              onChange={(e) => handleToggleChange(e.target.checked)}
              aria-describedby="gsm-approach-toggle-hint"
            />
            <span className="gsm-approach-toggle-switch" aria-hidden="true" />
            <span className="gsm-approach-toggle-text">
              Apply the section&apos;s default instruction for this topic too
            </span>
          </label>
          <p id="gsm-approach-toggle-hint" className="gsm-approach-toggle-hint">
            {applyDefault
              ? "The default style applies here. Add a note below to customize this topic only."
              : "Only what you write below will be used for this topic — the section default is ignored."}
          </p>

          <div className="gsm-approach-simple-field">
            <label className="gsm-field-label" htmlFor="gsm-topic-instruction-textarea">
              {applyDefault
                ? `Additional instruction for ${nodeTitle}`
                : `Custom instruction for ${nodeTitle}`}
            </label>
            <div className="gsm-field-wrap">
              <textarea
                id="gsm-topic-instruction-textarea"
                className="gsm-field"
                rows={4}
                value={modeText}
                maxLength={INSTRUCTION_LIMIT}
                aria-describedby="gsm-topic-instruction-help gsm-topic-instruction-count"
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={
                  applyDefault
                    ? "e.g. Include one real-world coding example to illustrate the concepts."
                    : `Describe exactly how AI should approach ${nodeTitle}…`
                }
              />
              <span
                id="gsm-topic-instruction-count"
                className={`gsm-field-count${modeText.length >= INSTRUCTION_LIMIT * 0.9 ? " gsm-field-count--near" : ""}`}
                aria-live="polite"
              >
                {modeText.length} / {INSTRUCTION_LIMIT}
              </span>
            </div>
            <p id="gsm-topic-instruction-help" className="gsm-field-help">
              {applyDefault
                ? `This note only applies to ${nodeTitle} — it won't change other topics.`
                : "This replaces the default style for this topic only."}
            </p>
          </div>
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
                "Save instruction"
              )}
            </button>
          </div>
        </div>
      </>
    );

    if (embedded) {
      return (
        <div
          className="gsm-embedded-block"
          id="gsm-approach-card"
          ref={ref as React.RefObject<HTMLDivElement>}
        >
          {body}
        </div>
      );
    }

    return (
      <section
        className="gsm-card gsm-card--collapsible gsm-card--open"
        id="gsm-approach-card"
        ref={ref}
      >
        <div id="gsm-approach-body" className="gsm-card__body gsm-embedded-block">
          {body}
        </div>
      </section>
    );
  }
);

export default ApproachChooser;
