import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2 } from "lucide-react";
import StudyMaterialDocument from "./StudyMaterialDocument";
import StudyMaterialRichTextEditor from "./StudyMaterialRichTextEditor";

interface StudyMaterialManualEditorProps {
  initialContent: string;
  title?: string;
  versionLabel: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (content: string) => void;
}

const StudyMaterialManualEditor: React.FC<StudyMaterialManualEditorProps> = ({
  initialContent,
  title,
  versionLabel,
  isSaving,
  onCancel,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDirty = content.trim() !== initialContent.trim();
  const canSave = isDirty && content.trim().length > 0 && !isSaving;

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const fullscreenButton = (
    <button
      type="button"
      className="study-material-rich-editor__tool-btn study-material-manual-editor__fullscreen-btn"
      onClick={() => setIsFullscreen((open) => !open)}
      aria-label={isFullscreen ? "Exit full-screen edit view" : "Open full-screen edit view"}
      title={isFullscreen ? "Exit full screen" : "Open full-screen edit view"}
    >
      {isFullscreen ? <Minimize2 size={15} aria-hidden /> : <Maximize2 size={15} aria-hidden />}
    </button>
  );

  const editor = (
    <>
      <div className="study-material-manual-editor__header">
        <div>
          {title && <h2 className="study-material-manual-editor__title">{title}</h2>}
          {versionLabel && (
            <span className="study-material-viewer__version-badge">
              Editing from {versionLabel}
            </span>
          )}
        </div>
        <div className="study-material-manual-editor__header-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          {isDirty && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onSave(content)}
              disabled={!canSave}
              style={{ minWidth: "140px" }}
            >
              {isSaving ? (
                <>
                  <span className="spinner" /> Saving…
                </>
              ) : (
                "Save as new version"
              )}
            </button>
          )}
        </div>
      </div>

      <p className="study-material-manual-editor__hint">
        Edit the document below like a Word file. Use the toolbar for headings, lists, and emphasis.
        Saving creates a new version without calling the AI.
      </p>

      <div className="study-material-manual-editor__body">
        <StudyMaterialDocument mode="editor">
          <StudyMaterialRichTextEditor
            initialMarkdown={initialContent}
            disabled={isSaving}
            onChange={setContent}
            toolbarEnd={fullscreenButton}
          />
        </StudyMaterialDocument>
      </div>
    </>
  );

  if (isFullscreen) {
    return createPortal(
      <div className="learning-experience learning-portal">
        <div
          className="study-material-manual-editor study-material-manual-editor--fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={title ? `Editing: ${title}` : "Manual edit"}
        >
          {editor}
        </div>
      </div>,
      document.body,
    );
  }

  return <div className="study-material-manual-editor">{editor}</div>;
};

export default StudyMaterialManualEditor;
