import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  BATCH_HUB_SESSION_TTL_MS,
  clearBatchHubSession,
  readBatchHubSession,
  writeBatchHubSession,
} from "./batchHubSession";

function createSessionStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("batchHubSession", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: createSessionStorageMock(),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when nothing is stored", () => {
    expect(readBatchHubSession("space-1")).toBeNull();
  });

  it("writes and reads a cohort batch id for a space", () => {
    const now = 1_700_000_000_000;
    writeBatchHubSession("space-1", "batch-abc", now);

    expect(readBatchHubSession("space-1", now)).toBe("batch-abc");
    expect(sessionStorage.getItem("sg_batch_hub_cohort_space-1")).toBe(
      JSON.stringify({ batchId: "batch-abc", savedAt: now })
    );
  });

  it("scopes keys per spaceId and overwrites on a new generate-all", () => {
    writeBatchHubSession("space-a", "batch-1", 100);
    writeBatchHubSession("space-b", "batch-2", 100);
    writeBatchHubSession("space-a", "batch-3", 200);

    expect(readBatchHubSession("space-a", 200)).toBe("batch-3");
    expect(readBatchHubSession("space-b", 200)).toBe("batch-2");
  });

  it("clears the cohort when dismissed", () => {
    writeBatchHubSession("space-1", "batch-abc", 100);
    clearBatchHubSession("space-1");

    expect(readBatchHubSession("space-1", 100)).toBeNull();
    expect(sessionStorage.getItem("sg_batch_hub_cohort_space-1")).toBeNull();
  });

  it("ignores and removes entries past the 24h TTL", () => {
    const savedAt = 1_700_000_000_000;
    writeBatchHubSession("space-1", "batch-stale", savedAt);

    const afterTtl = savedAt + BATCH_HUB_SESSION_TTL_MS + 1;
    expect(readBatchHubSession("space-1", afterTtl)).toBeNull();
    expect(sessionStorage.getItem("sg_batch_hub_cohort_space-1")).toBeNull();
  });

  it("accepts entries at the TTL boundary", () => {
    const savedAt = 1_700_000_000_000;
    writeBatchHubSession("space-1", "batch-edge", savedAt);

    expect(
      readBatchHubSession("space-1", savedAt + BATCH_HUB_SESSION_TTL_MS)
    ).toBe("batch-edge");
  });

  it("removes corrupt or incomplete payloads", () => {
    sessionStorage.setItem("sg_batch_hub_cohort_space-1", "{not-json");
    expect(readBatchHubSession("space-1")).toBeNull();

    sessionStorage.setItem(
      "sg_batch_hub_cohort_space-1",
      JSON.stringify({ batchId: "", savedAt: 1 })
    );
    expect(readBatchHubSession("space-1", 1)).toBeNull();

    sessionStorage.setItem(
      "sg_batch_hub_cohort_space-1",
      JSON.stringify({ batchId: "ok" })
    );
    expect(readBatchHubSession("space-1", 1)).toBeNull();
  });

  it("no-ops on empty space or batch ids", () => {
    writeBatchHubSession("", "batch-1");
    writeBatchHubSession("space-1", "");
    expect(sessionStorage.length).toBe(0);
    expect(readBatchHubSession("")).toBeNull();
  });
});
