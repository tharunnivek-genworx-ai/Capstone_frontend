import React from "react";

interface DeleteDraftConfirmModalProps {
  nodeTitle: string;
  versionCount: number;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const DeleteDraftConfirmModal: React.FC<DeleteDraftConfirmModalProps> = ({
  nodeTitle,
  versionCount,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => (
  <>
    <div
      onClick={isSubmitting ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 50,
        backdropFilter: "blur(4px)",
      }}
    />
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          pointerEvents: "auto",
          width: "min(440px, 95vw)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Delete all drafts
            </h2>
            <p
              style={{
                margin: "0.125rem 0 0",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
            >
              &ldquo;{nodeTitle}&rdquo;
            </p>
          </div>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
            This removes all {versionCount} study material draft{versionCount === 1 ? "" : "s"} for this topic,
            including archived versions. You&apos;ll return to the teaching page to generate fresh content
            (reference PDFs will be parsed again).
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
            This cannot be undone. If a quiz has been generated for this topic, delete the quiz first.
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn-danger"
              style={{ flex: 1, padding: "0.625rem 1rem" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting…" : "Delete drafts"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default DeleteDraftConfirmModal;
