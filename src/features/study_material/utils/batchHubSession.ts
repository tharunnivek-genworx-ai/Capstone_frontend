/** Session-scoped Generate All cohort for parent-hub restore (reload / new tab). */

const STORAGE_KEY_PREFIX = "sg_batch_hub_cohort";

/** Ignore cohort entries older than this so a stale tab never wrongly shows the hub. */
export const BATCH_HUB_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface BatchHubSessionEntry {
  batchId: string;
  savedAt: number;
}

function storageKey(spaceId: string): string {
  return `${STORAGE_KEY_PREFIX}_${spaceId}`;
}

function isBatchHubSessionEntry(value: unknown): value is BatchHubSessionEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.batchId === "string" &&
    record.batchId.length > 0 &&
    typeof record.savedAt === "number" &&
    Number.isFinite(record.savedAt)
  );
}

function isFresh(savedAt: number, now: number): boolean {
  return now - savedAt >= 0 && now - savedAt <= BATCH_HUB_SESSION_TTL_MS;
}

/** Persist the active Generate All cohort for a space (overwrites any prior entry). */
export function writeBatchHubSession(
  spaceId: string,
  batchId: string,
  now: number = Date.now()
): void {
  if (!spaceId || !batchId) return;
  try {
    const entry: BatchHubSessionEntry = { batchId, savedAt: now };
    sessionStorage.setItem(storageKey(spaceId), JSON.stringify(entry));
  } catch {
    /* quota / private mode — hub may not survive reload */
  }
}

/**
 * Read a valid cohort batch id for the space, or null if missing / corrupt / past TTL.
 * Stale entries are removed when discovered.
 */
export function readBatchHubSession(
  spaceId: string,
  now: number = Date.now()
): string | null {
  if (!spaceId) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(spaceId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isBatchHubSessionEntry(parsed) || !isFresh(parsed.savedAt, now)) {
      sessionStorage.removeItem(storageKey(spaceId));
      return null;
    }
    return parsed.batchId;
  } catch {
    try {
      sessionStorage.removeItem(storageKey(spaceId));
    } catch {
      /* ignore */
    }
    return null;
  }
}

/** Clear cohort when mentor dismisses batch navigation (or before overwrite is optional). */
export function clearBatchHubSession(spaceId: string): void {
  if (!spaceId) return;
  try {
    sessionStorage.removeItem(storageKey(spaceId));
  } catch {
    /* ignore */
  }
}
