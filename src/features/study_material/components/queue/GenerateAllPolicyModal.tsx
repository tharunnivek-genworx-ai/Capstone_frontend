import { useState } from "react";
import type { ExistingMaterialPolicy } from "../../types/studyMaterialBatch.types";

interface GenerateAllPolicyModalProps {
  defaultPolicy?: ExistingMaterialPolicy;
  isSubmitting?: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: (policy: ExistingMaterialPolicy) => void;
}

export default function GenerateAllPolicyModal({
  defaultPolicy = "skip",
  isSubmitting = false,
  onClose,
  onBack,
  onContinue,
}: GenerateAllPolicyModalProps) {
  const [policy, setPolicy] = useState<ExistingMaterialPolicy>(defaultPolicy);

  return (
    <>
      <div
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 120 }}
      />
      <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 130, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", width: "min(540px, 96vw)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Generation policy</h2>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "grid", gap: "0.7rem" }}>
            <label style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.7rem", display: "grid", gap: "0.3rem", cursor: "pointer" }}>
              <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="radio" checked={policy === "skip"} onChange={() => setPolicy("skip")} disabled={isSubmitting} />
                Skip topics that already have drafts
              </span>
            </label>
            <label style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.7rem", display: "grid", gap: "0.3rem", cursor: "pointer" }}>
              <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="radio" checked={policy === "regenerate"} onChange={() => setPolicy("regenerate")} disabled={isSubmitting} />
                Regenerate all selected topics
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", paddingLeft: "1.4rem" }}>
                Clears existing drafts first (same rules as single-topic Regenerate). Topics with live material or active quizzes are skipped with an error.
              </span>
            </label>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              Failed topics will not block the queue. Remaining topics continue automatically.
            </p>
          </div>
          <div style={{ padding: "0.9rem 1.25rem", borderTop: "1px solid var(--color-border)", display: "flex", gap: "0.6rem", justifyContent: "space-between" }}>
            <button className="btn-secondary" onClick={onBack} disabled={isSubmitting}>Back</button>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button className="btn-primary" onClick={() => onContinue(policy)} disabled={isSubmitting}>
                {isSubmitting ? "Starting..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
