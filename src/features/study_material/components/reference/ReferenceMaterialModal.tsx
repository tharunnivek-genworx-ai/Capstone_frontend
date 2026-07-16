import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ReferenceMaterialOut } from "../../types/studyMaterial.types";
import { referenceMaterialService } from "../../services/referenceMaterialService";

export type ReferenceMaterialModalMode = "manage" | "view";

interface ReferenceMaterialModalProps {
  spaceId: string;
  nodeId: string;
  nodeTitle: string;
  mode?: ReferenceMaterialModalMode;
  /** Reference material id stored on the active draft version (for unavailable state). */
  versionReferenceMaterialId?: string | null;
  existing: ReferenceMaterialOut | null;
  focusDropzone?: boolean;
  onClose: () => void;
  onUploaded: (material: ReferenceMaterialOut) => void;
  onDeleted: () => void;
  onRequestReplace?: () => void;
}

/** PDF/document uploaded as the AI generation source (reference_materials). */
const ReferenceMaterialModal: React.FC<ReferenceMaterialModalProps> = ({
  spaceId,
  nodeId,
  nodeTitle,
  mode = "manage",
  versionReferenceMaterialId = null,
  existing,
  focusDropzone = false,
  onClose,
  onUploaded,
  onDeleted,
  onRequestReplace,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [isVisibleToTrainees, setIsVisibleToTrainees] = useState(
    existing?.is_visible_to_trainees ?? false
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const isViewMode = mode === "view";
  const sourceUnavailable =
    isViewMode && !existing && Boolean(versionReferenceMaterialId);

  useEffect(() => {
    if (!focusDropzone || isViewMode) return;
    dropzoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => inputRef.current?.focus(), 200);
    return () => window.clearTimeout(timer);
  }, [focusDropzone, isViewMode]);

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
        title.trim(),
        isVisibleToTrainees
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

  const handleVisibilityChange = async (next: boolean) => {
    // While a replacement is staged, this switch configures the new upload.
    // It must not mutate the currently active source before Upload is confirmed.
    if (!existing || selectedFile) {
      setIsVisibleToTrainees(next);
      return;
    }
    setIsUpdatingVisibility(true);
    try {
      const material = await referenceMaterialService.updateVisibility(
        existing.material_id,
        next
      );
      setIsVisibleToTrainees(material.is_visible_to_trainees);
      onUploaded(material);
      toast.success(
        next
          ? "Source document is now visible to students in student resources."
          : "Source document hidden from students."
      );
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Could not update visibility.");
    } finally {
      setIsUpdatingVisibility(false);
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
          {!isViewMode && (
            <p className="reference-material-modal__hint">
              Upload a PDF or document that the AI will read when generating study material for this topic.
              Optionally share the same file with students in student resources.
            </p>
          )}

          {isViewMode && (
            <p className="reference-material-modal__hint">
              This is the source document tied to this topic. You can share it with students or replace it
              from the Generate page.
            </p>
          )}

          {sourceUnavailable && (
            <div className="reference-material-modal__existing reference-material-modal__existing--unavailable">
              <div className="reference-material-modal__list-main">
                <span className="reference-material-modal__list-badge">Source document</span>
                <div>
                  <p className="reference-material-modal__list-title">Source document unavailable</p>
                  <p className="reference-material-modal__list-meta">
                    The PDF used to generate this draft may have been removed.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                {!isViewMode && (
                  <button
                    type="button"
                    className="reference-material-modal__danger-btn"
                    disabled={isDeleting}
                    onClick={() => void handleDelete()}
                  >
                    {isDeleting ? "Removing…" : "Remove"}
                  </button>
                )}
              </div>
            </div>
          )}

          {!isViewMode && (
            <div>
              <label className="label">
                {existing ? "Replace with a new source document" : "Upload source document"}
              </label>
              <div
                ref={dropzoneRef}
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
          )}

          {!isViewMode && selectedFile && (
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

          {(isViewMode ? existing : selectedFile || existing) && (
            <div className="reference-material-modal__visibility">
              <label className="reference-material-modal__visibility-label">
                <input
                  type="checkbox"
                  className="reference-material-modal__visibility-input"
                  checked={isVisibleToTrainees}
                  disabled={isUpdatingVisibility || sourceUnavailable}
                  onChange={(e) => void handleVisibilityChange(e.target.checked)}
                />
                <span className="reference-material-modal__visibility-switch" aria-hidden="true" />
                <span className="reference-material-modal__visibility-text">
                  <strong>Share with students</strong>
                  <span>
                    Show this source document in student resources for trainees. Extracted
                    figures from the PDF are shared automatically when study material is
                    generated — you do not need to upload images separately.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="reference-material-modal__footer">
          {isViewMode ? (
            <>
              <button type="button" onClick={onClose} className="btn-secondary">Close</button>
              {onRequestReplace && (
                <button
                  type="button"
                  className="reference-material-modal__replace-link"
                  onClick={onRequestReplace}
                >
                  Replace with a new PDF →
                </button>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceMaterialModal;
