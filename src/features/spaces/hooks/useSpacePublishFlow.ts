import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { spaceService } from "../services/spaceService";
import type { SpaceResponse, SpaceUnpublishPreviewOut, RepublishChecklistNode } from "../types/space.types";
import { studyMaterialService } from "../../study_material/services/studyMaterialService";
import { mentorProgressService } from "../../mentor_progress_view";

type UseSpacePublishFlowParams = {
  space: SpaceResponse | null;
  spaceId: string | undefined;
  showSpaceProgress: boolean;
  refreshMentorSpaceProgress: () => void;
  setSpace: (space: SpaceResponse) => void;
};

/**
 * Space publish / unpublish / republish-checklist flow (extract-only from SpaceDetailPage).
 */
export function useSpacePublishFlow({
  space,
  spaceId,
  showSpaceProgress,
  refreshMentorSpaceProgress,
  setSpace,
}: UseSpacePublishFlowParams) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [unpublishPreview, setUnpublishPreview] = useState<SpaceUnpublishPreviewOut | null>(null);
  const [isLoadingUnpublishPreview, setIsLoadingUnpublishPreview] = useState(false);
  const [republishChecklist, setRepublishChecklist] = useState<RepublishChecklistNode[] | null>(null);

  const loadRepublishChecklist = useCallback(async (id: string) => {
    try {
      const checklist = await studyMaterialService.getRepublishChecklist(id);
      if (checklist.nodes_with_publishable_material.length > 0) {
        setRepublishChecklist(checklist.nodes_with_publishable_material);
      }
    } catch {
      // Non-blocking — space publish still succeeded.
    }
  }, []);

  const handlePublishSpace = useCallback(async () => {
    if (!space || !spaceId) return;
    setIsPublishing(true);
    try {
      const updated = await spaceService.publishSpace(spaceId, { is_published: true });
      setSpace(updated);
      toast.success("Space published!");
      await loadRepublishChecklist(spaceId);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to publish space.");
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, [space, spaceId, setSpace, loadRepublishChecklist]);

  const handleUnpublishSpace = useCallback(async () => {
    if (!space || !spaceId) return;
    setIsPublishing(true);
    try {
      const updated = await spaceService.publishSpace(spaceId, { is_published: false });
      setSpace(updated);
      setUnpublishPreview(null);
      await mentorProgressService.syncSpaceProgress(spaceId);
      if (showSpaceProgress) {
        void refreshMentorSpaceProgress();
      }
      toast.success("Space unpublished.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to unpublish space.");
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, [space, spaceId, setSpace, showSpaceProgress, refreshMentorSpaceProgress]);

  const handlePublishClick = useCallback(async () => {
    if (!space || !spaceId) return;
    if (space.is_published) {
      setIsLoadingUnpublishPreview(true);
      try {
        const preview = await spaceService.previewUnpublish(spaceId);
        setUnpublishPreview(preview);
      } catch {
        toast.error("Failed to load unpublish preview.");
      } finally {
        setIsLoadingUnpublishPreview(false);
      }
    } else {
      void handlePublishSpace();
    }
  }, [space, spaceId, handlePublishSpace]);

  const resetPublishFlowOnSpaceChange = useCallback(() => {
    setIsPublishing(false);
    setUnpublishPreview(null);
    setIsLoadingUnpublishPreview(false);
    setRepublishChecklist(null);
  }, []);

  return {
    isPublishing,
    unpublishPreview,
    setUnpublishPreview,
    isLoadingUnpublishPreview,
    republishChecklist,
    setRepublishChecklist,
    handlePublishSpace,
    handleUnpublishSpace,
    handlePublishClick,
    resetPublishFlowOnSpaceChange,
  };
}
