import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { htmlToMarkdown, markdownToHtml } from "../../utils/markdownConversion";

interface StudyMaterialRichTextEditorProps {
  initialMarkdown: string;
  disabled?: boolean;
  onChange: (markdown: string) => void;
}

type FormatCommand =
  | "bold"
  | "italic"
  | "formatBlock"
  | "insertUnorderedList"
  | "insertOrderedList";

const StudyMaterialRichTextEditor: React.FC<StudyMaterialRichTextEditorProps> = ({
  initialMarkdown,
  disabled = false,
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const syncMarkdown = useCallback(() => {
    if (!editorRef.current) return;
    onChange(htmlToMarkdown(editorRef.current.innerHTML));
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current || isReady) return;
    editorRef.current.innerHTML = markdownToHtml(initialMarkdown);
    setIsReady(true);
  }, [initialMarkdown, isReady]);

  const runCommand = (command: FormatCommand, value?: string) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    syncMarkdown();
  };

  const handleToolbarMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className="study-material-rich-editor">
      <div
        className="study-material-rich-editor__toolbar"
        role="toolbar"
        aria-label="Formatting toolbar"
        onMouseDown={handleToolbarMouseDown}
      >
        <button
          type="button"
          className="study-material-rich-editor__tool-btn"
          onClick={() => runCommand("bold")}
          disabled={disabled}
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="study-material-rich-editor__tool-btn"
          onClick={() => runCommand("italic")}
          disabled={disabled}
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={15} aria-hidden />
        </button>
        <span className="study-material-rich-editor__toolbar-divider" aria-hidden />
        <button
          type="button"
          className="study-material-rich-editor__tool-btn study-material-rich-editor__tool-btn--label"
          onClick={() => runCommand("formatBlock", "h2")}
          disabled={disabled}
          title="Section heading"
        >
          <Heading2 size={15} aria-hidden />
          <span>Section</span>
        </button>
        <button
          type="button"
          className="study-material-rich-editor__tool-btn study-material-rich-editor__tool-btn--label"
          onClick={() => runCommand("formatBlock", "h3")}
          disabled={disabled}
          title="Topic heading"
        >
          <Heading3 size={15} aria-hidden />
          <span>Topic</span>
        </button>
        <button
          type="button"
          className="study-material-rich-editor__tool-btn"
          onClick={() => runCommand("formatBlock", "p")}
          disabled={disabled}
          title="Normal paragraph"
        >
          ¶
        </button>
        <span className="study-material-rich-editor__toolbar-divider" aria-hidden />
        <button
          type="button"
          className="study-material-rich-editor__tool-btn"
          onClick={() => runCommand("insertUnorderedList")}
          disabled={disabled}
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="study-material-rich-editor__tool-btn"
          onClick={() => runCommand("insertOrderedList")}
          disabled={disabled}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="study-material-rich-editor__tool-btn"
          onClick={() => runCommand("formatBlock", "blockquote")}
          disabled={disabled}
          title="Quote"
          aria-label="Quote"
        >
          <Quote size={15} aria-hidden />
        </button>
      </div>

      <div
        ref={editorRef}
        className="study-material-viewer__body study-material-rich-editor__surface"
        contentEditable={!disabled}
        role="textbox"
        aria-multiline
        aria-label="Study material content"
        suppressContentEditableWarning
        onInput={syncMarkdown}
        onBlur={syncMarkdown}
      />
    </div>
  );
};

export default StudyMaterialRichTextEditor;
