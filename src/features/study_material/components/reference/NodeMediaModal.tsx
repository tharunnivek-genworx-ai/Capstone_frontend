import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import type { NodeMediaOut } from "../../types/studyMaterial.types";
import {
  referenceMaterialService,
  type NodeMediaAttachType,
} from "../../services/referenceMaterialService";

interface NodeMediaModalProps {
  nodeId: string;
  nodeTitle: string;
  nodeMedia: NodeMediaOut[];
  onClose: () => void;
  onRefresh: () => Promise<unknown>;
}

type UploadMode = "image" | "pdf" | "video_url" | "article_link";

const UPLOAD_MODE_LABELS: Record<UploadMode, string> = {
  image: "Image",
  pdf: "PDF file",
  video_url: "Video link",
  article_link: "Article link",
};

function mediaTypeLabel(type: NodeMediaOut["media_type"]): string {
  switch (type) {
    case "image":
      return "Image";
    case "pdf":
      return "PDF";
    case "video_url":
      return "Video";
    case "article_link":
      return "Link";
    default:
      return "Media";
  }
}

/** Supplementary topic resources (node_media) — not used by the AI generator. */
const NodeMediaModal: React.FC<NodeMediaModalProps> = ({
  nodeId,
  nodeTitle,
  nodeMedia,
  onClose,
  onRefresh,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("image");
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedFiles([]);
    setTitle("");
    setLinkUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addFiles = (files: FileList | File[]) => {
    const next = Array.from(files);
    if (next.length === 0) return;
    setSelectedFiles((prev) => {
      const merged = [...prev];
      for (const f of next) {
        if (!merged.some((existing) => existing.name === f.name && existing.size === f.size)) {
          merged.push(f);
        }
      }
      return merged;
    });
    if (!title && next.length === 1) {
      setTitle(next[0].name.replace(/\.[^.]+$/, ""));
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const needsFile = uploadMode === "image" || uploadMode === "pdf";
  const needsLink = uploadMode === "video_url" || uploadMode === "article_link";

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      if (needsFile) {
        if (selectedFiles.length === 0) return;
        const mediaType: NodeMediaAttachType = uploadMode === "image" ? "image" : "pdf";
        let added = 0;
        for (const file of selectedFiles) {
          const fileTitle =
            selectedFiles.length === 1 && title.trim()
              ? title.trim()
              : file.name.replace(/\.[^.]+$/, "");
          await referenceMaterialService.attachNodeMediaFile(
            nodeId,
            mediaType,
            file,
            fileTitle
          );
          added += 1;
        }
        toast.success(
          added === 1 ? "Student resource added." : `${added} student resources added.`
        );
      } else if (needsLink) {
        if (!linkUrl.trim()) return;
        await referenceMaterialService.attachNodeMediaLink(
          nodeId,
          uploadMode,
          linkUrl.trim(),
          title.trim() || undefined
        );
        toast.success("Student resource added.");
      }
      resetForm();
      await onRefresh();
    } catch (err) {
      const e = err as {
        response?: { data?: { detail?: string | Array<{ msg?: string }> } };
        message?: string;
      };
      const detail = e?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).filter(Boolean).join(", ")
        : typeof detail === "string"
          ? detail
          : e?.message ?? "Upload failed.";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    setDeletingId(mediaId);
    try {
      await referenceMaterialService.deleteNodeMedia(nodeId, mediaId);
      toast.success("Resource removed.");
      await onRefresh();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const canSubmit =
    !isUploading &&
    ((needsFile && selectedFiles.length > 0) || (needsLink && linkUrl.trim()));

  return (
    <div
      className="reference-material-modal__overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="reference-material-modal">
        <div className="reference-material-modal__header">
          <div>
            <h3 className="reference-material-modal__title">Student resources</h3>
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
            Attach images, PDFs, or links for trainees to view on this topic.
            These resources are not sent to the AI when generating study material.
            You can add multiple resources — keep this dialog open and add more after each upload.
          </p>

          <section className="reference-material-modal__section">
            <h4 className="reference-material-modal__section-title">Attached resources</h4>
            {nodeMedia.length === 0 ? (
              <p className="reference-material-modal__empty">No student resources yet.</p>
            ) : (
              <ul className="reference-material-modal__list">
                {nodeMedia.map((media) => {
                  const href = referenceMaterialService.mediaPublicUrl(media);
                  return (
                    <li key={media.media_id} className="reference-material-modal__list-item">
                      <div className="reference-material-modal__list-main">
                        <span className="reference-material-modal__list-badge reference-material-modal__list-badge--resource">
                          {mediaTypeLabel(media.media_type)}
                        </span>
                        <div>
                          <p className="reference-material-modal__list-title">
                            {media.title ?? href ?? "Untitled"}
                          </p>
                          {(media.url || media.file_url) && (
                            <p className="reference-material-modal__list-meta reference-material-modal__list-meta--truncate">
                              {media.url ?? media.file_url}
                            </p>
                          )}
                        </div>
                        {media.media_type === "image" && href && (
                          <img src={href} alt="" className="reference-material-modal__thumb" loading="lazy" />
                        )}
                      </div>
                      <div className="reference-material-modal__list-actions">
                        {href && (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="reference-material-modal__link-btn">
                            Open
                          </a>
                        )}
                        <button
                          type="button"
                          className="reference-material-modal__danger-btn"
                          disabled={deletingId === media.media_id}
                          onClick={() => void handleDelete(media.media_id)}
                        >
                          {deletingId === media.media_id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="reference-material-modal__section">
            <h4 className="reference-material-modal__section-title">Add resource</h4>
            <div className="reference-material-modal__mode-row">
              {(Object.keys(UPLOAD_MODE_LABELS) as UploadMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`reference-material-modal__mode-btn${
                    uploadMode === mode ? " reference-material-modal__mode-btn--active" : ""
                  }`}
                  onClick={() => {
                    setUploadMode(mode);
                    resetForm();
                  }}
                >
                  {UPLOAD_MODE_LABELS[mode]}
                </button>
              ))}
            </div>

            {needsFile && (
              <>
                <div
                  className={`reference-material-modal__dropzone${
                    dragging ? " reference-material-modal__dropzone--dragging" : ""
                  }${selectedFiles.length > 0 ? " reference-material-modal__dropzone--selected" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFiles.length > 0 ? (
                    <p className="reference-material-modal__dropzone-name">
                      {selectedFiles.length === 1
                        ? selectedFiles[0].name
                        : `${selectedFiles.length} files selected`}
                    </p>
                  ) : (
                    <p className="reference-material-modal__dropzone-name">
                      Drag & drop or <span>browse</span> (multiple allowed)
                    </p>
                  )}
                </div>
                {selectedFiles.length > 1 && (
                  <ul className="reference-material-modal__selected-files">
                    {selectedFiles.map((file, index) => (
                      <li key={`${file.name}-${file.size}`}>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          className="reference-material-modal__remove-file"
                          onClick={() => removeSelectedFile(index)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={uploadMode === "image" ? "image/*" : ".pdf,application/pdf"}
                  className="reference-material-modal__file-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addFiles(e.target.files);
                    }
                  }}
                />
                {selectedFiles.length <= 1 && (
                  <>
                    <label className="label" htmlFor="topic-resource-title">Title (optional)</label>
                    <input
                      id="topic-resource-title"
                      className="input-field"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={300}
                    />
                  </>
                )}
              </>
            )}

            {needsLink && (
              <>
                <label className="label" htmlFor="topic-resource-url">
                  {uploadMode === "video_url" ? "Video URL" : "Article URL"}
                </label>
                <input
                  id="topic-resource-url"
                  className="input-field"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <label className="label" htmlFor="topic-resource-link-title">Title (optional)</label>
                <input
                  id="topic-resource-link-title"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                />
              </>
            )}
          </section>
        </div>

        <div className="reference-material-modal__footer">
          <button type="button" onClick={onClose} className="btn-secondary">Close</button>
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!canSubmit}
            className="btn-primary"
          >
            {isUploading ? <><span className="spinner" />Adding…</> : needsFile && selectedFiles.length > 1 ? `Add ${selectedFiles.length} resources` : "Add resource"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeMediaModal;
