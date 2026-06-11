// src/features/spaces/components/ArchiveConfirmModal.tsx
/**
 * Confirmation dialog for archiving a node.
 * Two options: archive this node only, or archive with all descendants.
 */

import React, { useState } from "react";

interface ArchiveConfirmModalProps {
  nodeTitle: string;
  hasChildren: boolean;
  onClose: () => void;
  onConfirm: (archiveChildren: boolean) => void;
  isSubmitting?: boolean;
}

const ArchiveConfirmModal: React.FC<ArchiveConfirmModalProps> = ({
  nodeTitle,
  hasChildren,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [withChildren, setWithChildren] = useState(true);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal Center Wrapper */}
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
        {/* Modal */}
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
        {/* Header */}
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
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Archive Topic
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
              "{nodeTitle}"
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem" }}>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              margin: "0 0 1.25rem",
              lineHeight: 1.6,
            }}
          >
            Archived topics are hidden from the tree and won't count toward space progress.
            Historical attempts and data are preserved.
          </p>

          {hasChildren && (
            <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {/* Option 1: Archive only this node */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  background: !withChildren
                    ? "rgba(37,99,235,0.1)"
                    : "var(--color-surface)",
                  border: `1.5px solid ${!withChildren ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="archive-mode"
                  checked={!withChildren}
                  onChange={() => setWithChildren(false)}
                  style={{ marginTop: "2px", accentColor: "var(--color-primary)", flexShrink: 0 }}
                />
                <div>
                  <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    Archive this topic only
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Subtopics remain active and visible in the tree.
                  </p>
                </div>
              </label>

              {/* Option 2: Archive with children */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  background: withChildren
                    ? "rgba(239,68,68,0.08)"
                    : "var(--color-surface)",
                  border: `1.5px solid ${withChildren ? "rgba(239,68,68,0.4)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="archive-mode"
                  checked={withChildren}
                  onChange={() => setWithChildren(true)}
                  style={{ marginTop: "2px", accentColor: "var(--color-danger)", flexShrink: 0 }}
                />
                <div>
                  <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    Archive this topic and all subtopics
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    All descendant topics are also archived recursively.
                  </p>
                </div>
              </label>
            </div>
          )}

          {!hasChildren && (
            <div
              style={{
                padding: "0.875rem 1rem",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--radius-md)",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
              }}
            >
              This topic has no subtopics. It will be archived immediately.
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(hasChildren ? withChildren : false)}
              className="btn-danger"
              style={{ flex: 1, padding: "0.625rem 1rem" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ borderTopColor: "var(--color-danger)", width: "1rem", height: "1rem" }} />
                  Archiving…
                </>
              ) : (
                "Archive"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ArchiveConfirmModal;
