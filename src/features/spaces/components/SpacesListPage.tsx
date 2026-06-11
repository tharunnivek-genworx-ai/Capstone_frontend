// src/features/spaces/components/SpacesListPage.tsx
/**
 * Mentor's spaces list page.
 * Shows all spaces as cards with status, invite code copy, and quick actions.
 * "Create Space" button opens the creation modal.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSpaces } from "../hooks/useSpaces";
import { useAuth } from "../../auth/hooks/useAuth";
import type { SpaceResponse } from "../types/space.types";
import CreateSpaceModal from "./CreateSpaceModal";
import InviteCodeModal from "./InviteCodeModal";
import JoinSpaceModal from "./JoinSpaceModal";

// ── Space card ────────────────────────────────────────────────────────────────

const SpaceCard: React.FC<{
  space: SpaceResponse;
  onNavigate: () => void;
  onCopyInvite: () => void;
  onPublishToggle: () => void;
  isPublishing: boolean;
  isMentor: boolean;
}> = ({ space, onNavigate, onCopyInvite, onPublishToggle, isPublishing, isMentor }) => {
  const [codeCopied, setCodeCopied] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  const handlePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (space.is_published) {
      setShowUnpublishConfirm(true);
    } else {
      onPublishToggle();
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
      {/* Top accent */}
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

      {/* Header */}
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

      {/* Title + description */}
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

      {/* Invite code */}
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

      {/* Footer */}
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
        <div style={{ display: "flex", gap: "0.5rem", position: "relative" }} onClick={(e) => e.stopPropagation()}>
          {isMentor && (
            <>
              <button
                onClick={handlePublishClick}
                className={space.is_published ? "btn-danger" : "btn-primary"}
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
                disabled={isPublishing}
              >
                {isPublishing ? (
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
              {showUnpublishConfirm && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 0.5rem)",
                    right: 0,
                    zIndex: 20,
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "0.75rem",
                    boxShadow: "var(--shadow-subtle)",
                    minWidth: "220px",
                  }}
                >
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                    This will hide the space from trainees. Continue?
                  </p>
                  <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      onClick={(e) => { e.stopPropagation(); setShowUnpublishConfirm(false); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", background: "var(--color-danger)", color: "#fff", border: "none" }}
                      onClick={(e) => { e.stopPropagation(); setShowUnpublishConfirm(false); onPublishToggle(); }}
                      disabled={isPublishing}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </>
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
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const SpacesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isMentor = role === "mentor";
  const { spaces, total, isLoading, error, fetchSpaces, createSpace, publishSpace, clearError } =
    useSpaces();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [inviteModal, setInviteModal] = useState<{ code: string; name: string } | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handlePublishToggle = async (space: SpaceResponse) => {
    setPublishingId(space.space_id);
    try {
      await publishSpace(space.space_id, { is_published: !space.is_published });
      toast.success(space.is_published ? "Space unpublished." : "Space published!");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to update.");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyInvite = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied!");
    } catch {
      toast.error("Could not copy — please copy manually.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              margin: "0 0 0.25rem",
              color: "var(--color-text-primary)",
            }}
          >
            My Learning Spaces
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
            {isLoading
              ? "Loading…"
              : `${total} space${total !== 1 ? "s" : ""} in your account`}
          </p>
        </div>
        {isMentor ? (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
            style={{ padding: "0.75rem 1.25rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Learning Space
          </button>
        ) : (
          <button
            onClick={() => setShowJoin(true)}
            className="btn-primary"
            style={{ padding: "0.75rem 1.25rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Join Space
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <span
            className="spinner"
            style={{ borderTopColor: "var(--color-primary)", width: "2.5rem", height: "2.5rem" }}
          />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && spaces.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))",
              border: "1px solid rgba(37,99,235,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              No spaces yet
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              {isMentor ? (
                <>Create your first learning space to start building your outline<br />and sharing knowledge with your learners.</>
              ) : (
                <>You haven't been added to any spaces yet.<br />Wait for a mentor to add you or provide an invite code.</>
              )}
            </p>
          </div>
          {isMentor ? (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ padding: "0.875rem 2rem" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create your first space
            </button>
          ) : (
            <button
              onClick={() => setShowJoin(true)}
              className="btn-primary"
              style={{ padding: "0.875rem 2rem" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              Join a Space
            </button>
          )}
        </div>
      )}

      {/* Spaces grid */}
      {!isLoading && spaces.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {spaces.map((space) => (
            <SpaceCard
              key={space.space_id}
              space={space}
              onNavigate={() => navigate(`/${role}/spaces/${space.space_id}`)}
              onCopyInvite={() => space.invite_code && handleCopyInvite(space.invite_code)}
              onPublishToggle={() => handlePublishToggle(space)}
              isPublishing={publishingId === space.space_id}
              isMentor={isMentor}
            />
          ))}
        </div>
      )}

      {/* Create space modal */}
      {showCreate && (
        <CreateSpaceModal
          onClose={() => setShowCreate(false)}
          onSuccess={(space) => {
            setShowCreate(false);
            if (space.invite_code) {
              setInviteModal({ code: space.invite_code, name: space.space_name });
            }
          }}
          onCreate={createSpace}
        />
      )}

      {/* Invite code modal (shown after create) */}
      {inviteModal && (
        <InviteCodeModal
          inviteCode={inviteModal.code}
          spaceName={inviteModal.name}
          onClose={() => setInviteModal(null)}
        />
      )}

      {/* Join space modal */}
      {showJoin && (
        <JoinSpaceModal
          onClose={() => setShowJoin(false)}
          onSuccess={() => {
            setShowJoin(false);
            fetchSpaces();
          }}
        />
      )}
    </div>
  );
};

export default SpacesListPage;
