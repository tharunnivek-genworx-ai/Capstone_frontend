// SubtopicDefaultSection.tsx
// Controlled component for the "Default style for subtopics" row + slide-open editor.
// Manages its own open/closed state; the parent owns the value (branchDefault) and save.
import { useRef, useState } from "react";

interface SubtopicDefaultSectionProps {
  /** The topic name shown inside the editor intro callout */
  nodeName: string;
  /** Whether this node has children — softens the copy when false */
  hasChildren: boolean;
  /** Current value of tree_default_instruction (controlled by parent) */
  value: string;
  /** Called when the textarea changes; parent updates its branchDefault state */
  onChange: (val: string) => void;
  /** Called when the user clicks "Clear default"; parent resets value to "" */
  onClear: () => void;
  /** Persists instruction settings (including this default) to the server */
  onSave: () => void;
  isSaving: boolean;
  /** True when the textarea differs from the last-saved value on the node */
  isDirty: boolean;
  showSavedConfirm: boolean;
}

export default function SubtopicDefaultSection({
  nodeName,
  hasChildren,
  value,
  onChange,
  onClear,
  onSave,
  isSaving,
  isDirty,
  showSavedConfirm,
}: SubtopicDefaultSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasValue = value.trim().length > 0;

  const displayText = hasValue
    ? value.length > 72
      ? value.slice(0, 72) + "…"
      : value
    : null;

  const notSetText = hasChildren
    ? "Not set — subtopics will look for a style higher up"
    : "If you add subtopics later, they'll inherit this style";

  const buttonLabel = isOpen
    ? "Close"
    : hasValue
    ? "Edit default instruction"
    : "Set instruction";

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      // Focus textarea after CSS transition completes
      setTimeout(() => textareaRef.current?.focus(), 240);
    }
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  return (
    <>
      {/* Status row */}
      <div className="gsm-subtopic__row">
        <div className="gsm-subtopic__left">
          <span className="gsm-label">Default style for this section and its subtopics</span>
          <div className="gsm-subtopic__status">
            <span
              className={`gsm-subtopic__dot${hasValue ? " gsm-subtopic__dot--set" : ""}`}
              aria-hidden="true"
            />
            <span className={`gsm-subtopic__val${hasValue ? " gsm-subtopic__val--set" : ""}`}>
              {displayText ?? notSetText}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`gsm-btn-sd${isOpen ? " gsm-btn-sd--active" : ""}`}
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="gsm-subtopic-editor"
        >
          {/* Branching tree icon */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 01-9 9" />
          </svg>
          {buttonLabel}
        </button>
      </div>

      {/* Slide-open editor */}
      <div
        id="gsm-subtopic-editor"
        className={`gsm-subtopic__editor${isOpen ? " gsm-subtopic__editor--open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="gsm-subtopic__editor-intro">
          <strong>This is inherited, not applied here.</strong>{" "}
          Whatever you write below becomes the starting style for all subtopics of{" "}
          <em>{nodeName}</em> — unless a subtopic sets its own.
        </div>

        <div className="gsm-subtopic__editor-label">
          Default instruction for this section and its subtopics
        </div>

        <textarea
          ref={textareaRef}
          className="gsm-textarea"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Keep all subtopics practical — every concept should have a code snippet."
          tabIndex={isOpen ? 0 : -1}
        />

        <div className="gsm-subtopic__editor-actions">
          <button
            type="button"
            className="gsm-clear-btn"
            onClick={handleClear}
            disabled={isSaving}
            tabIndex={isOpen ? 0 : -1}
          >
            Clear default
          </button>

          <div className="gsm-subtopic__editor-actions-right">
            {showSavedConfirm && (
              <span className="gsm-subtopic__saved-hint">
                <span className="gsm-save-dot" aria-hidden="true" />
                Saved
              </span>
            )}
            <button
              type="button"
              className="gsm-btn gsm-btn--primary gsm-subtopic__save-btn"
              onClick={onSave}
              disabled={isSaving || !isDirty}
              tabIndex={isOpen ? 0 : -1}
            >
              {isSaving ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save default instruction"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
