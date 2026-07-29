import { getUserId } from "../../../lib/tokenStore";

const STORAGE_KEY_PREFIX = "sg_instruction_banner_dismissed";

function storageKey(): string {
  const userId = getUserId();
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

/** Load per-node instruction banner dismissals (nodeId → effective instruction). */
export function loadInstructionBannerDismissals(): Record<string, string> {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isRecordOfStrings(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist the full dismissal map. */
export function saveInstructionBannerDismissals(
  dismissed: Record<string, string>
): void {
  try {
    if (Object.keys(dismissed).length === 0) {
      localStorage.removeItem(storageKey());
      return;
    }
    localStorage.setItem(storageKey(), JSON.stringify(dismissed));
  } catch {
    /* quota / private mode — banner may reappear after reload */
  }
}
