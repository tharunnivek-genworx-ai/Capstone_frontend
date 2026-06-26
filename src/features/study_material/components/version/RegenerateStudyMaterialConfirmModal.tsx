import React from "react";

interface RegenerateStudyMaterialConfirmModalProps {
  nodeTitle: string;
  hasReferenceMaterial: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const RegenerateStudyMaterialConfirmModal: React.FC<RegenerateStudyMaterialConfirmModalProps> = ({
  nodeTitle,
  hasReferenceMaterial,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => (
  <>
    <div
      onClick={isSubmitting ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 50,
        backdropFilter: "blur(4px)",
      }}
    />
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          pointerEvents: "auto",
          width: "min(440px, 95vw)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Regenerate study materials?
          </h2>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            &ldquo;{nodeTitle}&rdquo;
          </p>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
            All drafts of your study material would be deleted. Are you sure?
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
            Fresh content will be generated using your current teaching settings
            {hasReferenceMaterial
              ? ", and your reference PDF will be parsed again."
              : "."}
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Regenerating…" : "Yes, regenerate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default RegenerateStudyMaterialConfirmModal;
