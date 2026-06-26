import React from "react";

export type StudyMaterialDocumentMode = "reader" | "editor" | "focus";

interface StudyMaterialDocumentProps {
  children: React.ReactNode;
  mode?: StudyMaterialDocumentMode;
  className?: string;
}

/** Paper-like document shell for reading and editing study material. */
const StudyMaterialDocument: React.FC<StudyMaterialDocumentProps> = ({
  children,
  mode = "reader",
  className = "",
}) => (
  <div
    className={`study-material-document study-material-document--${mode}${className ? ` ${className}` : ""}`}
  >
    <div className="study-material-document__page">
      <div className="study-material-document__content">{children}</div>
    </div>
  </div>
);

export default StudyMaterialDocument;
