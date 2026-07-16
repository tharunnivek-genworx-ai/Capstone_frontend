import { useEffect } from "react";
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

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
        className="gsm-queue-modal__backdrop"
      />
      <div className="gsm-queue-modal__layer">
        <div className="gsm-queue-modal" role="dialog" aria-modal="true" aria-labelledby="generate-all-warning-title">
          <div className="gsm-queue-modal__header gsm-queue-modal__header--warning">
            <span>Generate all · Review</span>
            <h2 id="generate-all-warning-title">{title}</h2>
          </div>
          <div className="gsm-queue-modal__body">
            <p className="gsm-queue-modal__copy">
              {body}
            </p>
            {showNoInstruction && warnings.missing_instruction_nodes.length > 0 && (
              <TopicWarningList
                label="Topics without instructions"
                names={warnings.missing_instruction_nodes.map((node) => node.title)}
              />
            )}
            {showInheritance && warnings.inherits_section_default_nodes.length > 0 && (
              <TopicWarningList
                label="Topics using inherited instructions"
                names={warnings.inherits_section_default_nodes.map((node) => node.title)}
              />
            )}
          </div>
          <div className="gsm-queue-modal__footer">
            <button className="as-button as-button--ghost" onClick={onBack} disabled={isSubmitting}>Back</button>
            <div>
              <button className="as-button as-button--secondary" onClick={onCustomize} disabled={isSubmitting}>
                Customize subtopics first
              </button>
              <button className="as-button as-button--primary" onClick={onProceed} disabled={isSubmitting}>
                {isSubmitting ? "Starting..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TopicWarningList({ label, names }: { label: string; names: string[] }) {
  const visible = names.slice(0, 5);
  return (
    <div className="gsm-warning-list">
      <strong>{label}</strong>
      <ul>
        {visible.map((name) => <li key={name}>{name}</li>)}
      </ul>
      {names.length > visible.length && <span>+{names.length - visible.length} more</span>}
    </div>
  );
}
