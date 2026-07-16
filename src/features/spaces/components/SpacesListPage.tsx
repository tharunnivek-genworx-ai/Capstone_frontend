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
import { BookOpen, Plus, Users } from "lucide-react";


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

  const openEntryModal = () => isMentor ? setShowCreate(true) : setShowJoin(true);

  return (
    <div className="space-entry-page animate-fade-in">
      <header className="space-entry-page__header">
        <div className="space-entry-page__heading">
          <span className="space-entry-page__eyebrow">
            {isMentor ? "Educator workspace" : "Your learning"}
          </span>
          <h1>My Learning Spaces</h1>
          <p>
            {isLoading
              ? "Loading your spaces…"
              : isMentor
                ? `${total} space${total !== 1 ? "s" : ""} ready to build and share`
                : `${total} space${total !== 1 ? "s" : ""} available to continue learning`}
          </p>
        </div>
        {isMentor ? (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary space-entry-page__primary-action"
          >
            <Plus size={18} aria-hidden="true" />
            Create Learning Space
          </button>
        ) : (
          <button
            onClick={() => setShowJoin(true)}
            className="btn-primary space-entry-page__primary-action"
          >
            <Users size={18} aria-hidden="true" />
            Join Space
          </button>
        )}
      </header>

      {isLoading && (
        <div className="space-entry-page__loading" role="status">
          <span className="spinner" />
          <span>Preparing your learning spaces…</span>
        </div>
      )}

      {!isLoading && spaces.length === 0 && (
        <section className="space-entry-empty" aria-labelledby="space-entry-empty-title">
          <div className="space-entry-empty__paper-stack" aria-hidden="true">
            <div className="space-entry-empty__paper">
              <BookOpen size={42} strokeWidth={1.4} />
            </div>
          </div>
          <h2 id="space-entry-empty-title">
            {isMentor ? "Create your first learning space" : "Join your first learning space"}
          </h2>
          <p>
            {isMentor
              ? "Build a clear topic outline, create study material, and invite learners when you are ready."
              : "Enter the invite code shared by your mentor to access topics, materials, quizzes, and progress."}
          </p>
          <button onClick={openEntryModal} className="btn-primary space-entry-empty__action">
            {isMentor ? <Plus size={18} aria-hidden="true" /> : <Users size={18} aria-hidden="true" />}
            {isMentor ? "Create your first space" : "Join a Space"}
          </button>
          {!isMentor && (
            <span className="space-entry-empty__note">
              Don&apos;t have a code? Ask your mentor to share the space invite.
            </span>
          )}
        </section>
      )}

      {!isLoading && spaces.length > 0 && (
        <section className={`space-entry-grid${isMentor ? "" : " space-entry-grid--trainee"}`} aria-label="Learning spaces">
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
        </section>
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
