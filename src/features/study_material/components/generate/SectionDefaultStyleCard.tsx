import { useRef, useState } from "react";
import { ChevronDown, Pencil, Tag } from "lucide-react";

interface SectionDefaultStyleCardProps {
  sectionName: string;
  hasChildren: boolean;
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

export default function SectionDefaultStyleCard({
  sectionName,
  hasChildren,
  value,
  onChange,
  onSave,
  isSaving,
  isDirty,
}: SectionDefaultStyleCardProps) {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const hasValue = trimmed.length > 0;

  const emptyQuote = hasChildren
    ? "No default style set yet — topics in this section will look for a style higher up in the tree."
    : "If you add subtopics later, they'll inherit whatever you set here.";

  const collapsedHint = hasValue
    ? "Default style set for this section"
    : "No default style set yet";

  const handleToggleEditor = () => {
    const opening = !isEditorOpen;
    setIsEditorOpen(opening);
    if (opening) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleCancel = () => {
    setIsEditorOpen(false);
  };

  return (
    <section
      className={`gsm-card gsm-card--collapsible${isCardOpen ? " gsm-card--open" : ""}`}
      id="gsm-section-default-card"
    >
      <button
        type="button"
        className="gsm-card__toggle"
        onClick={() => setIsCardOpen((v) => !v)}
        aria-expanded={isCardOpen}
        aria-controls="gsm-section-default-body"
      >
        <div className="gsm-card__head-left">
          <div className="gsm-card__icon" aria-hidden="true">
            <Tag size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="gsm-card__title">Default teaching style for this section</h3>
            {!isCardOpen && (
              <p className="gsm-card__collapsed-hint">{collapsedHint}</p>
            )}
            {isCardOpen && (
              <p className="gsm-card__sub">
                This is how AI teaches every topic in {sectionName}, unless a topic sets
                its own instructions below.
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

      {isCardOpen && (
        <div id="gsm-section-default-body" className="gsm-card__body">
          <div
            className={`gsm-default-style-quote${hasValue ? "" : " gsm-default-style-quote--empty"}`}
          >
            {hasValue ? `"${trimmed}"` : emptyQuote}
          </div>

          <div className="gsm-edit-standard-row">
            <div>
              <button
                type="button"
                className="gsm-link-btn"
                onClick={handleToggleEditor}
                aria-expanded={isEditorOpen}
                aria-controls="gsm-standard-editor"
              >
                <Pencil size={14} strokeWidth={1.8} aria-hidden />
                Change the default style for this section
              </button>
              <p className="gsm-edit-standard-hint">
                This updates {sectionName} and every topic inside it — not just this one.
              </p>
            </div>
          </div>

          <div
            id="gsm-standard-editor"
            className={`gsm-standard-editor${isEditorOpen ? " gsm-standard-editor--open" : ""}`}
            aria-hidden={!isEditorOpen}
          >
            <label className="gsm-field-label" htmlFor="gsm-standard-editor-field">
              Default style — {sectionName} section
            </label>
            <textarea
              ref={textareaRef}
              id="gsm-standard-editor-field"
              className="gsm-field"
              rows={4}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. Keep all subtopics practical — every concept should have a code snippet."
              tabIndex={isEditorOpen ? 0 : -1}
            />
            <div className="gsm-standard-editor-actions">
              <button
                type="button"
                className="gsm-btn gsm-btn--ghost gsm-btn--sm"
                onClick={handleCancel}
                disabled={isSaving}
                tabIndex={isEditorOpen ? 0 : -1}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gsm-btn gsm-btn--primary gsm-btn--sm"
                onClick={onSave}
                disabled={isSaving || !isDirty}
                tabIndex={isEditorOpen ? 0 : -1}
              >
                {isSaving ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  "Save default style"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
