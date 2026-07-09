import { ArrowUp, FileText, RefreshCw, Sparkles } from "lucide-react";
import type { InstructionMode } from "./instructionMode.types";
import { getApproachSummary } from "./instructionPreviewContent";

interface GenerationRailProps {
  nodeTitle: string;
  mode: InstructionMode;
  modeText: string;
  hasWorkspaceStudyMaterial: boolean;
  canClearAllDrafts: boolean;
  clearDraftsBlockReason?: string | null;
  isGenerating: boolean;
  isDeletingDrafts: boolean;
  isWaitingForGenerateAll?: boolean;
  onOpenExisting: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onScrollToApproach: () => void;
}

function buildStickySummary(mode: InstructionMode, modeText: string): string {
  const base = getApproachSummary(mode);
  const note = modeText.trim();
  if (mode !== "inherit" && note) {
    const preview = note.length > 56 ? `${note.slice(0, 56)}…` : note;
    return `${base} — "${preview}"`;
  }
  return base;
}

export default function GenerationRail({
  nodeTitle,
  mode,
  modeText,
  hasWorkspaceStudyMaterial,
  canClearAllDrafts,
  clearDraftsBlockReason,
  isGenerating,
  isDeletingDrafts,
  isWaitingForGenerateAll = false,
  onOpenExisting,
  onGenerate,
  onRegenerate,
  onScrollToApproach,
}: GenerationRailProps) {
  const isWorking = isGenerating || isDeletingDrafts;
  const blockManualGenerate = isWorking || isWaitingForGenerateAll;
  const summary = buildStickySummary(mode, modeText);

  return (
    <aside className="gsm-rail">
      <button
        type="button"
        className="gsm-sticky-note gsm-sticky-note--link"
        onClick={onScrollToApproach}
        aria-label={`Change how AI teaches ${nodeTitle}. Currently: ${summary}`}
      >
        <div className="gsm-sticky-note__label">What AI will use</div>
        <p className="gsm-sticky-note__summary">{summary}</p>
        <div className="gsm-sticky-note__foot">
          <span>Applies to {nodeTitle}</span>
          <span className="gsm-sticky-note__change">
            Change
            <ArrowUp size={12} strokeWidth={2.5} aria-hidden />
          </span>
        </div>
      </button>

      <div className="gsm-card gsm-ready-card">
        {hasWorkspaceStudyMaterial && (
          <div className="gsm-ready-status">
            <span className="gsm-ready-status__dot" aria-hidden="true" />
            <span className="gsm-ready-status__text">Draft ready to review</span>
          </div>
        )}

        <h3 className="gsm-ready-title">
          {isWaitingForGenerateAll ? "Waiting in generate-all" : "Ready when you are"}
        </h3>

        <p className="gsm-ready-sub">
          {isWaitingForGenerateAll
            ? "This topic will start automatically after earlier sections finish. Manual generate is blocked until then."
            : hasWorkspaceStudyMaterial
              ? `${nodeTitle} already has a draft. Keep reviewing it, or generate a brand-new version using the approach above.`
              : "When you're happy with the approach above, generate a first draft for AI to write."}
        </p>

        {isWaitingForGenerateAll && !isGenerating && (
          <p className="gsm-ready-waiting">
            Waiting for generate-all to reach this topic…
          </p>
        )}

        <div className="gsm-ready-actions">
          {hasWorkspaceStudyMaterial ? (
            <>
              <button
                type="button"
                className="gsm-btn gsm-btn--primary gsm-btn--block"
                onClick={onOpenExisting}
              >
                <FileText size={14} strokeWidth={1.8} aria-hidden />
                Open your draft
              </button>

              <button
                type="button"
                className="gsm-btn gsm-btn--outline-primary gsm-btn--block"
                onClick={onRegenerate}
                disabled={blockManualGenerate || !canClearAllDrafts}
                title={
                  isWaitingForGenerateAll
                    ? "Blocked until generate-all reaches this topic"
                    : !canClearAllDrafts
                      ? (clearDraftsBlockReason ?? "Cannot regenerate at this time")
                      : undefined
                }
              >
                <RefreshCw size={14} strokeWidth={1.8} aria-hidden />
                {isWorking ? "Working…" : "Generate a new draft"}
              </button>
            </>
          ) : (
            <button
              type="button"
              id="generate-study-material-btn"
              className="gsm-btn gsm-btn--primary gsm-btn--block"
              onClick={onGenerate}
              disabled={blockManualGenerate}
              title={
                isWaitingForGenerateAll
                  ? "Blocked until generate-all reaches this topic"
                  : undefined
              }
            >
              <Sparkles size={14} strokeWidth={1.8} aria-hidden />
              {isGenerating
                ? "Generating…"
                : isWaitingForGenerateAll
                  ? "Waiting…"
                  : "Generate draft"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
