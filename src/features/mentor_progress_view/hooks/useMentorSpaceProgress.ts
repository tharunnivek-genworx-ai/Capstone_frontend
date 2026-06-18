import { useCallback, useEffect, useState } from "react";
import type { MentorSpaceProgressOut } from "../types/mentorProgress.types";
import { mentorProgressService } from "../services/mentorProgressService";

export function useMentorSpaceProgress(spaceId: string | null) {
  const [progress, setProgress] = useState<MentorSpaceProgressOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await mentorProgressService.getSpaceProgress(spaceId);
      setProgress(data);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load space progress.");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { progress, isLoading, error, refresh };
}
