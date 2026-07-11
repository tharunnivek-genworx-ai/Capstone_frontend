import { FileText, RefreshCw, Sparkles } from "lucide-react";
import StudentReferenceCard from "./StudentReferenceCard";

interface GenerationRailProps {
  nodeTitle: string;
  nodeMediaCount: number;
  hasWorkspaceStudyMaterial: boolean;
  canClearAllDrafts: boolean;
  clearDraftsBlockReason?: string | null;
  isGenerating: boolean;
  isDeletingDrafts: boolean;
  isWaitingForGenerateAll?: boolean;
  onOpenExisting: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onOpenMediaModal: () => void;
}

export default function GenerationRail({
  nodeTitle,
  nodeMediaCount,
  hasWorkspaceStudyMaterial,
  canClearAllDrafts,
  clearDraftsBlockReason,
  isGenerating,
  isDeletingDrafts,
  isWaitingForGenerateAll = false,
  onOpenExisting,
  onGenerate,
  onRegenerate,
  onOpenMediaModal,
}: GenerationRailProps) {
  const isWorking = isGenerating || isDeletingDrafts;
  const blockManualGenerate = isWorking || isWaitingForGenerateAll;

  return (
    <aside className="gsm-rail">
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

      <StudentReferenceCard
        nodeMediaCount={nodeMediaCount}
        onOpenMediaModal={onOpenMediaModal}
      />
    </aside>
  );
}
