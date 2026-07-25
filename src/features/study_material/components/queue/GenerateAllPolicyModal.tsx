import { useEffect, useState } from "react";
import type {
  BatchPreviewItem,
  ExistingMaterialPolicy,
} from "../../types/studyMaterialBatch.types";

interface GenerateAllPolicyModalProps {
  defaultPolicy?: ExistingMaterialPolicy;
  isSubmitting?: boolean;
  blockedItems?: BatchPreviewItem[];
  onClose: () => void;
  onBack: () => void;
  onContinue: (policy: ExistingMaterialPolicy) => void;
}

export default function GenerateAllPolicyModal({
  defaultPolicy = "skip",
  isSubmitting = false,
  blockedItems = [],
  onClose,
  onBack,
  onContinue,
}: GenerateAllPolicyModalProps) {
  const [policy, setPolicy] = useState<ExistingMaterialPolicy>(defaultPolicy);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  return (
    <>
      <div
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        className="gsm-queue-modal__backdrop"
      />
      <div className="gsm-queue-modal__layer">
        <div className="gsm-queue-modal" role="dialog" aria-modal="true" aria-labelledby="generate-all-policy-title">
          <div className="gsm-queue-modal__header">
            <span>Generate all · Step 2</span>
            <h2 id="generate-all-policy-title">Choose how existing material is handled</h2>
            <p>The queue processes one topic at a time and keeps going if an individual topic fails.</p>
          </div>
          <div className="gsm-queue-modal__body">
            {blockedItems.length > 0 && (
              <div className="gsm-warning-list" role="status">
                <strong>
                  {blockedItems.length} selected topic{blockedItems.length === 1 ? "" : "s"} cannot be queued
                </strong>
                <ul>
                  {blockedItems.slice(0, 5).map((item) => (
                    <li key={item.node_id}>
                      {item.title}{item.block_reason ? ` — ${item.block_reason}` : ""}
                    </li>
                  ))}
                </ul>
                {blockedItems.length > 5 && <span>+{blockedItems.length - 5} more</span>}
              </div>
            )}
            <label className={`gsm-policy-option${policy === "skip" ? " gsm-policy-option--selected" : ""}`}>
              <span className="gsm-policy-option__title">
                <input type="radio" checked={policy === "skip"} onChange={() => setPolicy("skip")} disabled={isSubmitting} />
                Skip topics with a workspace draft or live material
              </span>
              <span className="gsm-policy-option__description">
                Creates a new draft for empty topics and for topics that only have previous or removed
                student history. Leaves workspace drafts and live material untouched.
              </span>
            </label>
            <label className={`gsm-policy-option${policy === "regenerate" ? " gsm-policy-option--selected" : ""}`}>
              <span className="gsm-policy-option__title">
                <input type="radio" checked={policy === "regenerate"} onChange={() => setPolicy("regenerate")} disabled={isSubmitting} />
                Regenerate all selected topics
              </span>
              <span className="gsm-policy-option__description">
                Clears workspace drafts first (same rules as single-topic Regenerate). Never deletes
                Previous for students. Topics blocked by live material or an active quiz fail — they
                are not skipped.
              </span>
            </label>
            <p className="gsm-queue-modal__copy">
              Generate All does not attach topic source PDFs. Generate source-grounded topics
              individually so the selected document is frozen into that draft.
            </p>
          </div>
          <div className="gsm-queue-modal__footer">
            <button className="as-button as-button--ghost" onClick={onBack} disabled={isSubmitting}>Back</button>
            <div>
              <button className="as-button as-button--secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button className="as-button as-button--primary" onClick={() => onContinue(policy)} disabled={isSubmitting}>
                {isSubmitting ? "Starting..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
