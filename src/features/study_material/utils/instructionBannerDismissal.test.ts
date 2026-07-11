import { describe, expect, it, beforeEach } from "vitest";
import {
  loadInstructionBannerDismissals,
  saveInstructionBannerDismissals,
} from "./instructionBannerDismissal";

function createLocalStorageMock(): Storage {
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

describe("instructionBannerDismissal", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createLocalStorageMock(),
      configurable: true,
    });
    localStorage.setItem("user_id", "user-1");
  });

  it("loads an empty map when nothing is stored", () => {
    expect(loadInstructionBannerDismissals()).toEqual({});
  });

  it("persists and reloads dismissals per user", () => {
    saveInstructionBannerDismissals({
      "node-a": "From parent section (React):\n\nUse examples",
    });

    expect(loadInstructionBannerDismissals()).toEqual({
      "node-a": "From parent section (React):\n\nUse examples",
    });
  });

  it("removes storage when the map is cleared", () => {
    saveInstructionBannerDismissals({ "node-a": "instruction" });
    saveInstructionBannerDismissals({});

    expect(loadInstructionBannerDismissals()).toEqual({});
    expect(localStorage.getItem("sg_instruction_banner_dismissed_user-1")).toBeNull();
  });
});
