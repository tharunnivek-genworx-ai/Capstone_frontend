import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { BookOpen, X } from "lucide-react";
import StudyMaterialViewer from "./StudyMaterialViewer";
import type { VersionLineageItem } from "../../types/studyMaterial.types";

interface StudyMaterialFocusModalProps {
  nodeId: string;
  title: string;
  content: string;
  versionLabel?: string | null;
  referenceMaterialId?: string | null;
  referenceImagesRefreshKey?: string | null;
  lineageChain?: VersionLineageItem[];
  onSelectLineageVersion?: (versionId: string) => void;
  onClose: () => void;
}

/** Full-screen reading view styled like study material on paper. */
const StudyMaterialFocusModal: React.FC<StudyMaterialFocusModalProps> = ({
  nodeId,
  title,
  content,
  versionLabel,
  referenceMaterialId,
  referenceImagesRefreshKey,
  lineageChain = [],
  onSelectLineageVersion,
  onClose,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="study-material-focus-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading: ${title}`}
    >
      <div className="study-material-focus-modal__header">
        <div className="study-material-focus-modal__header-left">
          <div className="study-material-focus-modal__icon" aria-hidden>
            <BookOpen size={18} />
          </div>
          <div className="study-material-focus-modal__header-copy">
            <p className="study-material-focus-modal__eyebrow">Study material</p>
            <h2 className="study-material-focus-modal__title">{title}</h2>
            {versionLabel && (
              <span className="study-material-focus-modal__version">{versionLabel}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary study-material-focus-modal__close"
          onClick={onClose}
          aria-label="Close reading view"
        >
          <X size={16} aria-hidden />
          Close
        </button>
      </div>
      <div className="study-material-focus-modal__body">
        <StudyMaterialViewer
          nodeId={nodeId}
          content={content}
          versionLabel={versionLabel}
          referenceMaterialId={referenceMaterialId}
          referenceImagesRefreshKey={referenceImagesRefreshKey}
          lineageChain={lineageChain}
          onSelectLineageVersion={onSelectLineageVersion}
          compactHeader
          documentLayout
          hideReferenceImages
        />
      </div>
    </div>,
    document.body
  );
};

export default StudyMaterialFocusModal;
