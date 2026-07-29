import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { TraineeStudyMaterialOut } from "../types/traineeStudyMaterial.types";
import { traineeStudyMaterialService } from "../services/traineeStudyMaterialService";
import {
  measureScrollDepth,
  resolveScrollContainer,
} from "../utils/scrollDepth";
import { notifyNodesUnlocked } from "../utils/unlockEvents";

interface UseTraineeStudyMaterialParams {
  nodeId: string | null;
  nodeTitle: string;
  spaceId?: string | null;
  onNodesUnlocked?: (nodeIds: string[]) => void;
}

export interface UseTraineeStudyMaterialReturn {
  material: TraineeStudyMaterialOut | null;
  isLoading: boolean;
  loadError: string | null;
  isDownloadingPdf: boolean;
  readPercent: number;
  handleDownloadPdf: () => Promise<void>;
  scrollContainerRef: React.RefCallback<HTMLDivElement>;
}

function extractErrorDetail(err: unknown): string {
  const e = err as { response?: { data?: string | { detail?: string } }; message?: string };
  if (typeof e?.response?.data === "string") return e.response.data;
  return e?.response?.data?.detail ?? e?.message ?? "Request failed.";
}

export function useTraineeStudyMaterial({
  nodeId,
  nodeTitle,
  spaceId = null,
  onNodesUnlocked,
}: UseTraineeStudyMaterialParams): UseTraineeStudyMaterialReturn {
  const [material, setMaterial] = useState<TraineeStudyMaterialOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [readPercent, setReadPercent] = useState(0);
  const lastReportedPercent = useRef(0);
  const latestMeasuredDepth = useRef(0);
  const progressTimer = useRef<number | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const nodeGenerationRef = useRef(0);

  const reportProgress = useCallback(
    async (measuredDepth: number) => {
      if (!nodeId || measuredDepth <= lastReportedPercent.current) return;
      const requestGeneration = nodeGenerationRef.current;
      try {
        const updated = await traineeStudyMaterialService.updateProgress(nodeId, {
          read_percent: measuredDepth,
        });
        if (nodeGenerationRef.current !== requestGeneration) return;
        lastReportedPercent.current = updated.study_material_read_percent;
        setReadPercent((prev) =>
          Math.max(prev, updated.study_material_read_percent)
        );
        if (updated.newly_unlocked_node_ids.length > 0) {
          const count = updated.newly_unlocked_node_ids.length;
          toast.success(
            count === 1 ? "A new subtopic is now available." : `${count} new subtopics are now available.`
          );
          if (spaceId) {
            notifyNodesUnlocked(spaceId, updated.newly_unlocked_node_ids);
          }
          onNodesUnlocked?.(updated.newly_unlocked_node_ids);
        }
      } catch {
        /* non-critical — progress is best-effort; local UI already updated */
      }
    },
    [nodeId, spaceId, onNodesUnlocked]
  );

  useEffect(() => {
    nodeGenerationRef.current += 1;
    if (!nodeId) {
      setMaterial(null);
      setLoadError(null);
      setReadPercent(0);
      latestMeasuredDepth.current = 0;
      lastReportedPercent.current = 0;
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setReadPercent(0);
    latestMeasuredDepth.current = 0;
    lastReportedPercent.current = 0;

    traineeStudyMaterialService
      .getPublished(nodeId)
      .then((published) => {
        if (cancelled) return;
        setMaterial(published);
        setReadPercent(published.study_material_read_percent);
        lastReportedPercent.current = published.study_material_read_percent;
      })
      .catch((err) => {
        if (cancelled) return;
        setMaterial(null);
        setLoadError(extractErrorDetail(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  const scrollContainerRef = useCallback<React.RefCallback<HTMLDivElement>>((anchor) => {
    scrollCleanupRef.current?.();
    scrollCleanupRef.current = null;
    if (!anchor || !nodeId || !material || material.node_id !== nodeId) return;

    const container = resolveScrollContainer(anchor);
    const handleScroll = () => {
      const measuredDepth = measureScrollDepth(anchor);
      latestMeasuredDepth.current = measuredDepth;
      // Update the bar immediately from local scroll depth; persist is debounced.
      setReadPercent((prev) =>
        Math.max(prev, measuredDepth, lastReportedPercent.current)
      );
      if (progressTimer.current !== null) {
        window.clearTimeout(progressTimer.current);
      }
      progressTimer.current = window.setTimeout(() => {
        void reportProgress(latestMeasuredDepth.current);
      }, 400);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    const initialMeasurementFrame = window.requestAnimationFrame(handleScroll);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => handleScroll());
    resizeObserver?.observe(anchor);
    if (container !== anchor) resizeObserver?.observe(container);
    scrollCleanupRef.current = () => {
      window.cancelAnimationFrame(initialMeasurementFrame);
      resizeObserver?.disconnect();
      container.removeEventListener("scroll", handleScroll);
      if (progressTimer.current !== null) {
        window.clearTimeout(progressTimer.current);
        progressTimer.current = null;
      }
      void reportProgress(latestMeasuredDepth.current);
    };
  }, [nodeId, material, reportProgress]);

  useEffect(() => () => {
    scrollCleanupRef.current?.();
    scrollCleanupRef.current = null;
  }, []);

  const handleDownloadPdf = async () => {
    if (!nodeId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const safeTitle = nodeTitle.trim() || "study-material";
      await traineeStudyMaterialService.downloadPublishedPdf(nodeId, `${safeTitle}.pdf`);
    } catch (err) {
      toast.error(extractErrorDetail(err));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return {
    material,
    isLoading,
    loadError,
    isDownloadingPdf,
    readPercent,
    handleDownloadPdf,
    scrollContainerRef,
  };
}
