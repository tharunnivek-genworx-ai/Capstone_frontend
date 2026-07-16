import React, { useState } from "react";
import toast from "react-hot-toast";
import type { SpaceResponse, SpaceUnpublishPreviewOut } from "../types/space.types";
import { spaceService } from "../services/spaceService";
import EspaceUnpublishConfirmModal from "./EspaceUnpublishConfirmModal";
import type { TraineeOwnSpaceProgressOut } from "../../trainee_space_progress/types/traineeSpaceProgress.types";
import SpaceCardProgressPreview from "../../trainee_space_progress/components/SpaceCardProgressPreview";
import type { MentorSpaceProgressSummaryOut } from "../../mentor_progress_view/types/mentorProgress.types";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clipboard,
  Copy,
  TriangleAlert,
  Users,
} from "lucide-react";

interface SpaceCardProps {
  space: SpaceResponse;
  onNavigate: () => void;
  onCopyInvite: () => void;
  onPublish: (space: SpaceResponse) => void;
  onUnpublish: (space: SpaceResponse) => Promise<void>;
  isPublishing: boolean;
  isMentor: boolean;
  traineeProgress?: TraineeOwnSpaceProgressOut | null;
  isTraineeProgressLoading?: boolean;
  mentorProgress?: MentorSpaceProgressSummaryOut | null;
  isMentorProgressLoading?: boolean;
}

const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  onNavigate,
  onCopyInvite,
  onPublish,
  onUnpublish,
  isPublishing,
  isMentor,
  traineeProgress = null,
  isTraineeProgressLoading = false,
  mentorProgress = null,
  isMentorProgressLoading = false,
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
    <article
      className={`space-entry-card${space.is_published ? " space-entry-card--published" : ""}`}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open ${space.space_name}`}
    >
      <div className="space-entry-card__topline" />
      <div className="space-entry-card__header">
        <span className="space-entry-card__icon" aria-hidden="true">
          <BookOpen size={21} />
        </span>
        <span className={`space-entry-card__status${space.is_published ? " space-entry-card__status--live" : ""}`}>
          {space.is_published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="space-entry-card__content">
        <h2 title={space.space_name}>{space.space_name}</h2>
        {space.description ? (
          <p>{space.description}</p>
        ) : (
          <p className="space-entry-card__description--empty">No description added</p>
        )}
        {space.is_transferred_away && (
          <div className="space-entry-card__warning" role="status">
            <TriangleAlert size={15} aria-hidden="true" />
            <span>This space was transferred. Contact your IT admin for changes.</span>
          </div>
        )}
      </div>

      {!isMentor && (
        <SpaceCardProgressPreview
          progress={traineeProgress}
          isLoading={isTraineeProgressLoading}
        />
      )}

      {isMentor && (
        <div className="space-entry-card__metrics">
          {isMentorProgressLoading ? (
            <div className="space-entry-card__metric-loading" role="status">
              <span className="spinner" />
              <span className="sr-only">Loading progress summary</span>
            </div>
          ) : mentorProgress ? (
            <>
              <div className="space-entry-card__metric">
                <BookOpen size={17} aria-hidden="true" />
                <div>
                  <span>Total topics</span>
                  <strong>{mentorProgress.total_nodes}</strong>
                </div>
              </div>
              <div className="space-entry-card__metric">
                <Users size={17} aria-hidden="true" />
                <div>
                  <span>Enrolled learners</span>
                  <strong>{mentorProgress.total_enrolled_trainees}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="space-entry-card__metric-empty">Progress appears after topics are added.</div>
          )}
        </div>
      )}

      {isMentor && space.invite_code && (
        <button
          type="button"
          onClick={handleCopy}
          className="space-entry-card__invite"
          aria-label={`Copy invite code ${space.invite_code}`}
        >
          <Clipboard size={15} aria-hidden="true" />
          <span>Invite code</span>
          <code>{space.invite_code}</code>
          {codeCopied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        </button>
      )}

      <footer className="space-entry-card__footer">
        <time dateTime={space.created_at}>
          {new Date(space.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </time>
        <div className="space-entry-card__actions" onClick={(e) => e.stopPropagation()}>
          {isMentor && (
            <button
              onClick={handlePublishClick}
              className={space.is_published ? "btn-danger" : "btn-primary"}
              disabled={isPublishing || isLoadingPreview}
            >
              {isPublishing || isLoadingPreview ? (
                <span className="spinner" />
              ) : space.is_published ? (
                "Unpublish"
              ) : (
                "Publish Space"
              )}
            </button>
          )}
          <button
            onClick={onNavigate}
            className="btn-secondary"
          >
            Open
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </footer>

      {unpublishPreview && (
        <EspaceUnpublishConfirmModal
          preview={unpublishPreview}
          onClose={() => !isPublishing && setUnpublishPreview(null)}
          onConfirm={() => void handleConfirmUnpublish()}
          isSubmitting={isPublishing}
        />
      )}
    </article>
  );
};

export default SpaceCard;
