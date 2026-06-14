import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ReferenceMaterialOut } from "../types/studyMaterial.types";
import { referenceMaterialService } from "../services/referenceMaterialService";

interface ReferenceMaterialModalProps {
  spaceId: string;
  nodeId: string;
  nodeTitle: string;
  existing: ReferenceMaterialOut | null;
  onClose: () => void;
  onUploaded: (material: ReferenceMaterialOut) => void;
  onDeleted: () => void;
}

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
      toast.success("Reference material uploaded.");
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
      toast.success("Reference material removed.");
      onDeleted();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--color-bg-surface)",
          borderRadius: "var(--radius-xl)",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.125rem 1.25rem 0.875rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Reference Material
            </h3>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {nodeTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.25rem", borderRadius: "var(--radius-sm)", display: "flex" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Existing material info */}
          {existing && !selectedFile && (
            <div
              style={{
                background: "var(--color-bg-surface-alt)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.75">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {existing.title}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {existing.file_name}
                  {existing.file_size_bytes ? ` · ${(existing.file_size_bytes / 1024).toFixed(0)} KB` : ""}
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  background: "none",
                  border: "1px solid var(--color-danger)",
                  color: "var(--color-danger)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.3rem 0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {isDeleting ? "Removing…" : "Remove"}
              </button>
            </div>
          )}

          {/* Drop zone */}
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", display: "block", marginBottom: "0.5rem" }}>
              {existing ? "Replace with a new file" : "Upload PDF or Document"}
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "var(--color-primary)" : selectedFile ? "var(--color-success)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem 1rem",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "var(--color-primary-subtle)" : selectedFile ? "var(--color-success-subtle)" : "var(--color-bg-surface-alt)",
                transition: "all 0.15s",
              }}
            >
              {selectedFile ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" style={{ marginBottom: "0.375rem" }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-success)" }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {(selectedFile.size / 1024).toFixed(0)} KB · click to change
                  </p>
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" style={{ marginBottom: "0.375rem" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    Drag & drop or <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>browse</span>
                  </p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    PDF, DOCX, PPTX up to 50 MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Title */}
          {selectedFile && (
            <div>
              <label className="label" htmlFor="ref-mat-title">
                Title
              </label>
              <input
                id="ref-mat-title"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. React Hooks Reference Guide"
                maxLength={300}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.625rem",
          }}
        >
          <button onClick={onClose} className="btn-secondary" style={{ minWidth: "80px" }}>
            Cancel
          </button>
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={isUploading || !title.trim()}
              className="btn-primary"
              style={{ minWidth: "120px" }}
            >
              {isUploading ? <><span className="spinner" />Uploading…</> : "Upload"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceMaterialModal;
