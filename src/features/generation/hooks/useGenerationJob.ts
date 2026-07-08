import { useCallback, useState } from "react";
import { generationJobService } from "../services/generationProgressService";
import type { GenerationJobStartResponse } from "../types/generationJob.types";
import type { GenerationProgressOut } from "../types/generationProgress.types";

interface UseGenerationJobOptions {
  onProgress?: (progress: GenerationProgressOut) => void;
}

export function useGenerationJob(options: UseGenerationJobOptions = {}) {
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgressOut | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (startFn: () => Promise<GenerationJobStartResponse>) => {
      setIsRunning(true);
      setError(null);
      setProgress(null);
      try {
        const onProgress = (next: GenerationProgressOut) => {
          setProgress(next);
          options.onProgress?.(next);
        };
        const { runId: nextRunId, progress: finalProgress, result } =
          await generationJobService.runJob(startFn, onProgress);
        setRunId(nextRunId);
        setProgress(finalProgress);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed.";
        setError(message);
        throw err;
      } finally {
        setIsRunning(false);
      }
    },
    [options],
  );

  const resumePolling = useCallback(
    async (existingRunId: string) => {
      setRunId(existingRunId);
      setIsRunning(true);
      setError(null);
      try {
        const onProgress = (next: GenerationProgressOut) => {
          setProgress(next);
          options.onProgress?.(next);
        };
        const finalProgress = await generationJobService.waitForCompletion(
          existingRunId,
          onProgress,
        );
        setProgress(finalProgress);
        if (finalProgress.status === "failed") {
          throw new Error(finalProgress.error ?? "Generation failed.");
        }
        return await generationJobService.getResult(existingRunId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed.";
        setError(message);
        throw err;
      } finally {
        setIsRunning(false);
      }
    },
    [options],
  );

  return {
    runId,
    progress,
    isRunning,
    error,
    start,
    resumePolling,
  };
}
