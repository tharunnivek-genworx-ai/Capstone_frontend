import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StudyMaterialManualEditorProps {
  initialContent: string;
  title?: string;
  versionLabel: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (content: string) => void;
}

type EditorTab = "edit" | "preview";

const StudyMaterialManualEditor: React.FC<StudyMaterialManualEditorProps> = ({
  initialContent,
  title,
  versionLabel,
  isSaving,
  onCancel,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<EditorTab>("edit");
  const canSave = content.trim().length > 0 && !isSaving;

  return (
    <div className="study-material-manual-editor">
      <div className="study-material-manual-editor__header">
        <div>
          {title && <h2 className="study-material-viewer__title">{title}</h2>}
          {versionLabel && (
            <span className="study-material-viewer__version-badge">
              Editing from {versionLabel}
            </span>
          )}
        </div>
        <div className="study-material-manual-editor__tabs">
          <button
            type="button"
            className={`study-material-manual-editor__tab${
              tab === "edit" ? " study-material-manual-editor__tab--active" : ""
            }`}
            onClick={() => setTab("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`study-material-manual-editor__tab${
              tab === "preview" ? " study-material-manual-editor__tab--active" : ""
            }`}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      <p className="study-material-manual-editor__hint">
        Edit the full markdown below. Saving creates a new manual-edit version without calling the AI.
      </p>

      <div className="study-material-manual-editor__body">
        {tab === "edit" ? (
          <textarea
            className="input-field study-material-manual-editor__textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSaving}
            spellCheck
          />
        ) : (
          <div className="study-material-viewer__body study-material-manual-editor__preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
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
