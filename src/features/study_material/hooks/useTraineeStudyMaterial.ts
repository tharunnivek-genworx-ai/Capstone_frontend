import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { TraineeStudyMaterialOut } from "../types/studyMaterial.types";
import { studyMaterialService } from "../services/studyMaterialService";

interface UseTraineeStudyMaterialParams {
  nodeId: string | null;
  nodeTitle: string;
}

export interface UseTraineeStudyMaterialReturn {
  material: TraineeStudyMaterialOut | null;
  isLoading: boolean;
  loadError: string | null;
  isDownloadingPdf: boolean;
  readPercent: number;
  handleDownloadPdf: () => Promise<void>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

function extractErrorDetail(err: unknown): string {
  const e = err as { response?: { data?: string | { detail?: string } }; message?: string };
  if (typeof e?.response?.data === "string") return e.response.data;
  return e?.response?.data?.detail ?? e?.message ?? "Request failed.";
}

function computeScrollPercent(container: HTMLElement): number {
  const maxScroll = container.scrollHeight - container.clientHeight;
  if (maxScroll <= 0) return 100;
  return Math.min(100, Math.round((container.scrollTop / maxScroll) * 100));
}

export function useTraineeStudyMaterial({
  nodeId,
  nodeTitle,
}: UseTraineeStudyMaterialParams): UseTraineeStudyMaterialReturn {
  const [material, setMaterial] = useState<TraineeStudyMaterialOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [readPercent, setReadPercent] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastReportedPercent = useRef(0);
  const progressTimer = useRef<number | null>(null);

  const reportProgress = useCallback(
    async (percent: number) => {
      if (!nodeId || percent <= lastReportedPercent.current) return;
      lastReportedPercent.current = percent;
      try {
        await studyMaterialService.updateProgress(nodeId, { read_percent: percent });
      } catch {
        /* non-critical — progress is best-effort */
      }
    },
    [nodeId]
  );

  useEffect(() => {
    if (!nodeId) {
      setMaterial(null);
      setLoadError(null);
      setReadPercent(0);
      lastReportedPercent.current = 0;
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setReadPercent(0);
    lastReportedPercent.current = 0;

    studyMaterialService
      .getPublished(nodeId)
      .then((published) => {
        if (cancelled) return;
        setMaterial(published);
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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !nodeId || !material) return;

    const handleScroll = () => {
      const percent = computeScrollPercent(container);
      setReadPercent((prev) => Math.max(prev, percent));
      if (progressTimer.current !== null) {
        window.clearTimeout(progressTimer.current);
      }
      progressTimer.current = window.setTimeout(() => {
        void reportProgress(percent);
      }, 400);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (progressTimer.current !== null) {
        window.clearTimeout(progressTimer.current);
      }
    };
  }, [nodeId, material, reportProgress]);

  const handleDownloadPdf = async () => {
    if (!nodeId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const safeTitle = nodeTitle.trim() || "study-material";
      await studyMaterialService.downloadPublishedPdf(nodeId, `${safeTitle}.pdf`);
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
