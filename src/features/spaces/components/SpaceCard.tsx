import React, { useState } from "react";
import toast from "react-hot-toast";
import type { SpaceResponse, SpaceUnpublishPreviewOut } from "../types/space.types";
import { spaceService } from "../services/spaceService";
import EspaceUnpublishConfirmModal from "./EspaceUnpublishConfirmModal";

interface SpaceCardProps {
  space: SpaceResponse;
  onNavigate: () => void;
  onCopyInvite: () => void;
  onPublish: (space: SpaceResponse) => void;
  onUnpublish: (space: SpaceResponse) => Promise<void>;
  isPublishing: boolean;
  isMentor: boolean;
}

const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  onNavigate,
  onCopyInvite,
  onPublish,
  onUnpublish,
  isPublishing,
  isMentor,
}) => {
  const [codeCopied, setCodeCopied] = useState(false);
  const [unpublishPreview, setUnpublishPreview] = useState<SpaceUnpublishPreviewOut | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePublishClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (space.is_published) {
      setIsLoadingPreview(true);
      try {
        const preview = await spaceService.previewUnpublish(space.space_id);
        setUnpublishPreview(preview);
      } catch {
        toast.error("Failed to load unpublish preview.");
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      onPublish(space);
    }
  };

  const handleConfirmUnpublish = async () => {
    try {
      await onUnpublish(space);
      setUnpublishPreview(null);
    } catch {
      // Parent shows error toast; keep modal open.
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyInvite();
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div
      className="card"
      onClick={onNavigate}
      style={{
        cursor: "pointer",
        transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-primary)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: space.is_published
            ? "var(--color-success)"
            : "var(--color-border)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", paddingTop: "0.25rem" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2563eb22, #1d4ed822)",
            border: "1px solid rgba(37,99,235,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: "0 0 0.375rem",
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={space.space_name}
        >
          {space.space_name}
        </h3>
        {space.description ? (
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.5,
            }}
          >
            {space.description}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
            No description
          </p>
        )}
      </div>

      {isMentor && space.invite_code && (
        <div
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.625rem 0.875rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            cursor: "copy",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          title="Click to copy invite code"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <code
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--color-primary)",
              fontFamily: "monospace",
              flex: 1,
            }}
          >
            {space.invite_code}
          </code>
          {codeCopied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--color-border)",
          paddingTop: "0.75rem",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {new Date(space.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
          {isMentor && (
            <button
              onClick={handlePublishClick}
              className={space.is_published ? "btn-danger" : "btn-primary"}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
              disabled={isPublishing || isLoadingPreview}
            >
              {isPublishing || isLoadingPreview ? (
                <span
                  className="spinner"
                  style={{
                    borderTopColor: space.is_published ? "var(--color-danger)" : "var(--color-primary)",
                    width: "0.875rem",
                    height: "0.875rem",
                  }}
                />
              ) : space.is_published ? (
                "Unpublish"
              ) : (
                "Publish Space"
              )}
            </button>
          )}
          <button
            onClick={onNavigate}
            className="btn-primary"
            style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
          >
            Open
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {unpublishPreview && (
        <EspaceUnpublishConfirmModal
          preview={unpublishPreview}
          onClose={() => !isPublishing && setUnpublishPreview(null)}
          onConfirm={() => void handleConfirmUnpublish()}
          isSubmitting={isPublishing}
        />
      )}
    </div>
  );
};

export default SpaceCard;
