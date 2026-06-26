import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ReferenceMaterialOut } from "../../types/studyMaterial.types";
import { referenceMaterialService } from "../../services/referenceMaterialService";

interface ReferenceMaterialModalProps {
  spaceId: string;
  nodeId: string;
  nodeTitle: string;
  existing: ReferenceMaterialOut | null;
  onClose: () => void;
  onUploaded: (material: ReferenceMaterialOut) => void;
  onDeleted: () => void;
}

/** PDF/document uploaded as the AI generation source (reference_materials). */
const ReferenceMaterialModal: React.FC<ReferenceMaterialModalProps> = ({
  spaceId,
  nodeId,
  nodeTitle,
  existing,
  onClose,
  onUploaded,
  onDeleted,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFile = (f: File) => {
    setSelectedFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    setIsUploading(true);
    try {
      const material = await referenceMaterialService.uploadToNode(
        spaceId,
        nodeId,
        selectedFile,
        title.trim()
      );
      toast.success("Source document uploaded.");
      onUploaded(material);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setIsDeleting(true);
    try {
      await referenceMaterialService.delete(existing.material_id);
      toast.success("Source document removed.");
      onDeleted();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const existingHref = existing
    ? referenceMaterialService.materialFileUrl(existing)
    : null;

  return (
    <div
      className="reference-material-modal__overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="reference-material-modal">
        <div className="reference-material-modal__header">
          <div>
            <h3 className="reference-material-modal__title">Source document for generation</h3>
            <p className="reference-material-modal__subtitle">{nodeTitle}</p>
          </div>
          <button type="button" className="reference-material-modal__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="reference-material-modal__body">
          <p className="reference-material-modal__hint">
            Upload a PDF or document that the AI will read when generating study material for this topic.
            This is separate from topic resources shown to trainees.
          </p>

          {existing && !selectedFile && (
            <div className="reference-material-modal__existing">
              <div className="reference-material-modal__list-main">
                <span className="reference-material-modal__list-badge">Active source</span>
                <div>
                  <p className="reference-material-modal__list-title">{existing.title}</p>
                  <p className="reference-material-modal__list-meta">
                    {existing.file_name}
                    {existing.file_size_bytes
                      ? ` · ${(existing.file_size_bytes / 1024).toFixed(0)} KB`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="reference-material-modal__list-actions">
                {existingHref && (
                  <a href={existingHref} target="_blank" rel="noopener noreferrer" className="reference-material-modal__link-btn">
                    View
                  </a>
                )}
                <button
                  type="button"
                  className="reference-material-modal__danger-btn"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="label">
              {existing ? "Replace with a new source document" : "Upload source document"}
            </label>
            <div
              className={`reference-material-modal__dropzone${
                dragging ? " reference-material-modal__dropzone--dragging" : ""
              }${selectedFile ? " reference-material-modal__dropzone--selected" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              {selectedFile ? (
                <>
                  <p className="reference-material-modal__dropzone-name">{selectedFile.name}</p>
                  <p className="reference-material-modal__dropzone-hint">
                    {(selectedFile.size / 1024).toFixed(0)} KB · click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="reference-material-modal__dropzone-name">
                    Drag & drop or <span>browse</span>
                  </p>
                  <p className="reference-material-modal__dropzone-hint">PDF, DOCX, PPTX up to 50 MB</p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="reference-material-modal__file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {selectedFile && (
            <div>
              <label className="label" htmlFor="gen-source-title">Title</label>
              <input
                id="gen-source-title"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SDLC lecture notes"
                maxLength={300}
              />
            </div>
          )}
        </div>

        <div className="reference-material-modal__footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          {selectedFile && (
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || !title.trim()}
              className="btn-primary"
            >
              {isUploading ? <><span className="spinner" />Uploading…</> : "Upload source"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceMaterialModal;
