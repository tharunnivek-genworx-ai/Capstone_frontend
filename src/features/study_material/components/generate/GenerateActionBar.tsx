// GenerateActionBar.tsx
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";

interface GenerateActionBarProps {
  /** True when the node already has at least one draft or published study material */
  hasWorkspaceStudyMaterial: boolean;
  /** Whether the regenerate action is allowed (clearDrafts eligibility) */
  canClearAllDrafts: boolean;
  /** Tooltip for disabled regenerate button */
  clearDraftsBlockReason?: string | null;
  /** AI generation in progress */
  isGenerating: boolean;
  /** Draft deletion in progress (before regenerate) */
  isDeletingDrafts: boolean;
  /** Navigate to Page 2 to view the existing study material */
  onOpenExisting: () => void;
  /** Trigger first-time generation */
  onGenerate: () => void;
  /** Open the regenerate confirmation modal */
  onRegenerate: () => void;
}

export default function GenerateActionBar({
  hasWorkspaceStudyMaterial,
  canClearAllDrafts,
  clearDraftsBlockReason,
  isGenerating,
  isDeletingDrafts,
  onOpenExisting,
  onGenerate,
  onRegenerate,
}: GenerateActionBarProps) {
  const isWorking = isGenerating || isDeletingDrafts;

  return (
    <div className="gsm-generate-bar">
      <div className="gsm-generate-bar__text">
        <h3 className="gsm-generate-bar__title">Ready to generate</h3>
        <p className="gsm-generate-bar__subtitle">
          Your teaching style above will guide the AI.
        </p>
      </div>

      <div className="gsm-generate-bar__btns">
        {hasWorkspaceStudyMaterial && (
          <>
            {/* Open existing material on Page 2 */}
            <button
              type="button"
              className="gsm-btn gsm-btn--outline"
              onClick={onOpenExisting}
            >
              Open existing
              <ArrowRight size={13} aria-hidden />
            </button>

            {/* Regenerate (secondary, shown when drafts exist) */}
            <button
              type="button"
              className="gsm-btn gsm-btn--secondary"
              onClick={onRegenerate}
              disabled={isWorking || !canClearAllDrafts}
              title={
                !canClearAllDrafts
                  ? (clearDraftsBlockReason ?? "Cannot regenerate at this time")
                  : undefined
              }
            >
              <RefreshCw size={13} aria-hidden />
              {isWorking ? "Working…" : "Regenerate"}
            </button>
          </>
        )}

        {/* First-time generate — only before any study material exists */}
        {!hasWorkspaceStudyMaterial && (
          <button
            type="button"
            id="generate-study-material-btn"
            className="gsm-btn gsm-btn--green"
            onClick={onGenerate}
            disabled={isWorking}
          >
            <Sparkles size={14} aria-hidden />
            {isGenerating ? "Generating…" : "Generate draft"}
          </button>
        )}
      </div>
    </div>
  );
}
