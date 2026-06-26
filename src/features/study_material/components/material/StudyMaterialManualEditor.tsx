import React, { useState } from "react";
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
  const canSave = content.trim().length > 0 && !isSaving;

  return (
    <div className="study-material-manual-editor">
      <div className="study-material-manual-editor__header">
        <div>
          {title && <h2 className="study-material-manual-editor__title">{title}</h2>}
          {versionLabel && (
            <span className="study-material-viewer__version-badge">
              Editing from {versionLabel}
            </span>
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
          />
        </StudyMaterialDocument>
      </div>

      <div className="study-material-manual-editor__footer">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
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
      </div>
    </div>
  );
};

export default StudyMaterialManualEditor;
