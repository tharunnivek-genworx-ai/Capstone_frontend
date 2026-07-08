import toast from "react-hot-toast";
import { logGenerateAllDebug } from "../components/queue/GenerateAllDebugPanel";
import type {
  ExistingMaterialPolicy,
  StudyMaterialBatchPreviewItem,
} from "../types/studyMaterialBatch.types";
import type { NodeStudyStatePatch } from "../types/studyMaterial.types";
import { studyMaterialService } from "./studyMaterialService";

const INLINE_GENERATE_MAX_ATTEMPTS = 4;
const INLINE_GENERATE_RETRY_BASE_MS = 2000;

export interface RunGenerateAllSequentiallyArgs {
  items: StudyMaterialBatchPreviewItem[];
  policy: ExistingMaterialPolicy;
  signal?: { cancelled: boolean };
  patchNodeStudyState: (nodeId: string, patch: NodeStudyStatePatch) => void;
  onNodeStarted: (nodeId: string) => void;
  onNodeFinished: (nodeId: string) => void;
  onContentRefresh: (nodeId: string) => void;
}

function extractErrorDetail(err: unknown): string {
  const e = err as {
    response?: { data?: { detail?: string | { msg?: string }[] }; status?: number };
    message?: string;
  };
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  return e?.message ?? "Generation failed.";
}

function isLockOrConflictError(err: unknown): boolean {
  const detail = extractErrorDetail(err).toLowerCase();
  const status = (err as { response?: { status?: number } })?.response?.status;
  return (
    status === 409
    || detail.includes("generation lock")
    || detail.includes("already has an active generation")
    || detail.includes("conflict")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function generateInlineWithRetry(
  nodeId: string,
  payload: { reference_material_id: string | null },
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < INLINE_GENERATE_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await studyMaterialService.generateInline(nodeId, payload);
    } catch (err) {
      lastError = err;
      if (!isLockOrConflictError(err) || attempt === INLINE_GENERATE_MAX_ATTEMPTS - 1) {
        throw err;
      }
      const waitMs = INLINE_GENERATE_RETRY_BASE_MS * (attempt + 1);
      logGenerateAllDebug("warn", `generateInline retry ${attempt + 1}`, {
        node_id: nodeId,
        wait_ms: waitMs,
        detail: extractErrorDetail(err),
      });
      await sleep(waitMs);
    }
  }
  throw lastError;
}

/**
 * Frontend sequential generate-all: one inline request per topic.
 * Each call holds the server request (and advisory lock) until that node finishes.
 */
export async function runGenerateAllSequentially(
  args: RunGenerateAllSequentiallyArgs,
): Promise<void> {
  const {
    items,
    policy,
    signal,
    patchNodeStudyState,
    onNodeStarted,
    onNodeFinished,
    onContentRefresh,
  } = args;

  const runnable = items.filter((item) => item.can_generate);
  logGenerateAllDebug("info", "Sequential generate-all start", {
    total: items.length,
    runnable: runnable.length,
    policy,
    titles: runnable.map((i) => i.title),
    mode: "inline",
  });

  for (let index = 0; index < runnable.length; index += 1) {
    if (signal?.cancelled) {
      logGenerateAllDebug("warn", "Sequential generate-all cancelled");
      break;
    }

    const item = runnable[index];
    const nodeId = item.node_id;
    const label = `${index + 1}/${runnable.length} ${item.title}`;

    try {
      if (policy === "skip") {
        const uiState = await studyMaterialService.getMentorUiState(nodeId);
        if (uiState.has_versions) {
          logGenerateAllDebug("warn", `skip (existing material) node=${item.title}`, {
            node_id: nodeId,
          });
          toast(`Skipped ${item.title} — material already exists.`);
          onNodeFinished(nodeId);
          continue;
        }
      } else {
        // "Regenerate all" = same path as single-topic regenerate-from-scratch:
        // clear discardable drafts first, but honour published-SM / quiz guards.
        const uiState = await studyMaterialService.getMentorUiState(nodeId);
        if (uiState.has_versions) {
          const eligibility = await studyMaterialService.getClearDraftsEligibility(nodeId);
          if (!eligibility.can_clear) {
            const reason =
              eligibility.block_reason
              ?? "Cannot regenerate — unpublish live material or remove quizzes first.";
            logGenerateAllDebug("warn", `regenerate blocked node=${item.title}`, {
              node_id: nodeId,
              reason,
            });
            throw new Error(reason);
          }
          logGenerateAllDebug("info", `clearAllDrafts node=${item.title}`, {
            node_id: nodeId,
            version_count: eligibility.version_count,
          });
          await studyMaterialService.clearAllDrafts(nodeId);
        }
      }

      logGenerateAllDebug("info", `generateInline node=${item.title}`, {
        node_id: nodeId,
        index: index + 1,
        of: runnable.length,
      });
      onNodeStarted(nodeId);
      patchNodeStudyState(nodeId, {
        hasTriggeredGeneration: true,
        currentPage: 2,
        isGenerating: true,
        generationProgressSessionId: null,
        activeGenerationRunId: null,
      });

      const result = await generateInlineWithRetry(nodeId, {
        reference_material_id: null,
      });
      logGenerateAllDebug("ok", `completed ${label}`, { run_id: result.run_id });

      patchNodeStudyState(nodeId, {
        isGenerating: false,
        generationProgressSessionId: null,
        activeGenerationRunId: null,
        hasTriggeredGeneration: true,
        studyMaterialContent: result.content,
        activeVersion: result,
      });
      onContentRefresh(nodeId);
      toast.success(`Generated: ${item.title}`);
    } catch (err) {
      const detail = extractErrorDetail(err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      logGenerateAllDebug("error", `failed ${label}`, { status, detail });
      patchNodeStudyState(nodeId, {
        isGenerating: false,
        generationProgressSessionId: null,
        activeGenerationRunId: null,
        hasTriggeredGeneration: false,
        currentPage: 1,
      });
      toast.error(`${item.title}: ${detail}`);
    } finally {
      onNodeFinished(nodeId);
      logGenerateAllDebug("info", "next", {
        remaining: Math.max(0, runnable.length - index - 1),
      });
    }
  }

  logGenerateAllDebug("ok", "Sequential generate-all finished");
}
