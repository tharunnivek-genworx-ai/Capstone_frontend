import { useRef, useState } from "react";
import { Pencil } from "lucide-react";

interface SectionDefaultStyleCardProps {
  sectionName: string;
  hasChildren: boolean;
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  embedded?: boolean;
}

export default function SectionDefaultStyleCard({
  sectionName,
  hasChildren,
  value,
  onChange,
  onSave,
  isSaving,
  isDirty,
  embedded = false,
}: SectionDefaultStyleCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const hasValue = trimmed.length > 0;

  const emptyQuote = hasChildren
    ? "No default style set yet"
    : "If you add subtopics later, they'll inherit whatever you set here.";

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

  const body = (
    <>
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
            {hasValue ? "Change default style" : "Set a default style"}
          </button>
          {!embedded && (
            <p className="gsm-edit-standard-hint">
              This updates {sectionName} and every topic inside it — not just this one.
            </p>
          )}
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
    </>
  );

  if (embedded) {
    return <div className="gsm-embedded-block">{body}</div>;
  }

  return (
    <section className="gsm-card gsm-card--collapsible gsm-card--open" id="gsm-section-default-card">
      <div id="gsm-section-default-body" className="gsm-card__body gsm-embedded-block">
        {body}
      </div>
    </section>
  );
}
