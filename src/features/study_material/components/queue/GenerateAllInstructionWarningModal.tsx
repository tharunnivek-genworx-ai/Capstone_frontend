import type { StudyMaterialBatchPreviewWarnings } from "../../types/studyMaterialBatch.types";

interface GenerateAllInstructionWarningModalProps {
  warnings: StudyMaterialBatchPreviewWarnings;
  isSubmitting?: boolean;
  onClose: () => void;
  onBack: () => void;
  onProceed: () => void;
  onCustomize: () => void;
}

export default function GenerateAllInstructionWarningModal({
  warnings,
  isSubmitting = false,
  onClose,
  onBack,
  onProceed,
  onCustomize,
}: GenerateAllInstructionWarningModalProps) {
  const showNoInstruction = warnings.show_no_instruction_warning;
  const showInheritance = warnings.show_inheritance_warning;

  const title = showNoInstruction
    ? "Generate without instructions?"
    : "Subtopics inherit section instructions";

  const body = showNoInstruction
    ? "Some selected topics have no effective teaching instructions. The generator will create a generic draft for those topics."
    : "Some selected subtopics will inherit tree or section default instructions. Review those subtopics first if you want custom behavior.";

  return (
    <>
      <div
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 120 }}
      />
      <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 130, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", width: "min(560px, 96vw)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>{title}</h2>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "grid", gap: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
              {body}
            </p>
            {showNoInstruction && warnings.missing_instruction_nodes.length > 0 && (
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {warnings.missing_instruction_nodes.slice(0, 5).map((node) => node.title).join(", ")}
              </div>
            )}
            {showInheritance && warnings.inherits_section_default_nodes.length > 0 && (
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {warnings.inherits_section_default_nodes.slice(0, 5).map((node) => node.title).join(", ")}
              </div>
            )}
          </div>
          <div style={{ padding: "0.9rem 1.25rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", gap: "0.6rem" }}>
            <button className="btn-secondary" onClick={onBack} disabled={isSubmitting}>Back</button>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button className="btn-secondary" onClick={onCustomize} disabled={isSubmitting}>
                Customize subtopics first
              </button>
              <button className="btn-primary" onClick={onProceed} disabled={isSubmitting}>
                {isSubmitting ? "Starting..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
