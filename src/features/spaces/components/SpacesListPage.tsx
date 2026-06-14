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

import SpaceCard from "./SpaceCard";

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
