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
import type { RepublishChecklistNode, SpaceResponse } from "../types/space.types";
import { studyMaterialService } from "../../study_material/services/studyMaterialService";
import CreateSpaceModal from "./CreateSpaceModal";
import InviteCodeModal from "./InviteCodeModal";
import JoinSpaceModal from "./JoinSpaceModal";
import EspaceRepublishChecklistModal from "./EspaceRepublishChecklistModal";
import SpaceCard from "./SpaceCard";
import { traineeSpaceProgressService } from "../../trainee_space_progress/services/traineeSpaceProgressService";
import type { TraineeOwnSpaceProgressOut } from "../../trainee_space_progress/types/traineeSpaceProgress.types";
import { mentorProgressService } from "../../mentor_progress_view/services/mentorProgressService";
import type { MentorSpaceProgressSummaryOut } from "../../mentor_progress_view/types/mentorProgress.types";


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
  const [republishModal, setRepublishModal] = useState<{
    spaceName: string;
    nodes: RepublishChecklistNode[];
  } | null>(null);
  const [spaceProgressById, setSpaceProgressById] = useState<Record<string, TraineeOwnSpaceProgressOut>>({});
  const [loadingProgressIds, setLoadingProgressIds] = useState<Record<string, boolean>>({});
  const [mentorProgressById, setMentorProgressById] = useState<Record<string, MentorSpaceProgressSummaryOut>>({});
  const [loadingMentorProgressIds, setLoadingMentorProgressIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  useEffect(() => {
    if (isMentor || spaces.length === 0) {
      setSpaceProgressById({});
      setLoadingProgressIds({});
      return;
    }
    const load = async () => {
      const loadingMap: Record<string, boolean> = {};
      for (const space of spaces) loadingMap[space.space_id] = true;
      setLoadingProgressIds(loadingMap);
      const results = await Promise.all(
        spaces.map(async (space) => {
          try {
            const progress = await traineeSpaceProgressService.getOwnSpaceProgress(space.space_id);
            return [space.space_id, progress] as const;
          } catch {
            return [space.space_id, null] as const;
          }
        }),
      );
      const next: Record<string, TraineeOwnSpaceProgressOut> = {};
      for (const [spaceId, progress] of results) {
        if (progress) next[spaceId] = progress;
      }
      setSpaceProgressById(next);
      setLoadingProgressIds({});
    };
    void load();
  }, [isMentor, spaces]);

  useEffect(() => {
    if (!isMentor || spaces.length === 0) {
      setMentorProgressById({});
      setLoadingMentorProgressIds({});
      return;
    }
    const load = async () => {
      const loadingMap: Record<string, boolean> = {};
      for (const space of spaces) loadingMap[space.space_id] = true;
      setLoadingMentorProgressIds(loadingMap);
      const results = await Promise.all(
        spaces.map(async (space) => {
          try {
            const summary = await mentorProgressService.getSpaceProgressSummary(space.space_id);
            return [space.space_id, summary] as const;
          } catch {
            return [space.space_id, null] as const;
          }
        }),
      );
      const next: Record<string, MentorSpaceProgressSummaryOut> = {};
      for (const [spaceId, summary] of results) {
        if (summary) next[spaceId] = summary;
      }
      setMentorProgressById(next);
      setLoadingMentorProgressIds({});
    };
    void load();
  }, [isMentor, spaces]);

  const loadRepublishChecklist = async (space: SpaceResponse) => {
    try {
      const checklist = await studyMaterialService.getRepublishChecklist(space.space_id);
      if (checklist.nodes_with_publishable_material.length > 0) {
        setRepublishModal({
          spaceName: space.space_name,
          nodes: checklist.nodes_with_publishable_material,
        });
      }
    } catch {
      // Non-blocking after successful publish.
    }
  };

  const handlePublish = async (space: SpaceResponse) => {
    setPublishingId(space.space_id);
    try {
      await publishSpace(space.space_id, { is_published: true });
      toast.success("Space published!");
      await loadRepublishChecklist(space);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to publish space.");
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (space: SpaceResponse) => {
    setPublishingId(space.space_id);
    try {
      await publishSpace(space.space_id, { is_published: false });
      toast.success("Space unpublished.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to unpublish space.");
      throw err;
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

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <span
            className="spinner"
            style={{ borderTopColor: "var(--color-primary)", width: "2.5rem", height: "2.5rem" }}
          />
        </div>
      )}

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

      {!isLoading && spaces.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMentor
              ? "repeat(auto-fill, minmax(300px, 1fr))"
              : "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {spaces.map((space) => (
            <SpaceCard
              key={space.space_id}
              space={space}
              onNavigate={() => navigate(`/${role}/spaces/${space.space_id}`)}
              onCopyInvite={() => space.invite_code && handleCopyInvite(space.invite_code)}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              isPublishing={publishingId === space.space_id}
              isMentor={isMentor}
              traineeProgress={spaceProgressById[space.space_id] ?? null}
              isTraineeProgressLoading={Boolean(loadingProgressIds[space.space_id])}
              mentorProgress={mentorProgressById[space.space_id] ?? null}
              isMentorProgressLoading={Boolean(loadingMentorProgressIds[space.space_id])}
            />
          ))}
        </div>
      )}

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

      {inviteModal && (
        <InviteCodeModal
          inviteCode={inviteModal.code}
          spaceName={inviteModal.name}
          onClose={() => setInviteModal(null)}
        />
      )}

      {showJoin && (
        <JoinSpaceModal
          onClose={() => setShowJoin(false)}
          onSuccess={() => {
            setShowJoin(false);
            fetchSpaces();
          }}
        />
      )}

      {republishModal && (
        <EspaceRepublishChecklistModal
          spaceName={republishModal.spaceName}
          nodes={republishModal.nodes}
          onClose={() => setRepublishModal(null)}
        />
      )}
    </div>
  );
};

export default SpacesListPage;
