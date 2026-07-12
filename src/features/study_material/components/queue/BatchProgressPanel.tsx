import { useState } from "react";
import type { BatchDetailOut, BatchStepOut } from "../../types/studyMaterialBatch.types";

interface BatchProgressPanelProps {
  batchDetail: BatchDetailOut;
  currentRunningStep: BatchStepOut | null;
  isPolling: boolean;
  onCancel: () => void;
}

export default function BatchProgressPanel({
  batchDetail,
  currentRunningStep,
  isPolling,
  onCancel,
}: BatchProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const { batch, steps } = batchDetail;
  const terminal =
    batch.status === "completed" || batch.status === "failed" || batch.status === "cancelled";
  const finishedCount = batch.completed_steps + batch.failed_steps + batch.skipped_steps;
  const pendingSteps = steps.filter((step) => step.status === "pending");
  const failedSteps = steps.filter((step) => step.status === "failed");

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        width: "min(400px, calc(100vw - 2rem))",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        zIndex: 110,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          border: "none",
          borderBottom: isExpanded ? "1px solid var(--color-border)" : "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-expanded={isExpanded}
      >
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Generate all
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
            {finishedCount} / {batch.total_steps} done
            {pendingSteps.length > 0 && !terminal ? ` · ${pendingSteps.length} remaining` : ""}
            {isPolling ? " · updating" : ""}
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            flexShrink: 0,
            color: "var(--color-text-muted)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div style={{ padding: "0.75rem 1rem", display: "grid", gap: "0.65rem" }}>
          {currentRunningStep && !terminal && (
            <div
              style={{
                padding: "0.55rem 0.65rem",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface-1)",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>
                Now generating
              </div>
              <div style={{ fontWeight: 500 }}>{currentRunningStep.node_title}</div>
            </div>
          )}

          {pendingSteps.length > 0 && !terminal && (
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginBottom: "0.35rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Up next
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: "0.3rem",
                  maxHeight: "140px",
                  overflowY: "auto",
                }}
              >
                {pendingSteps.slice(0, 8).map((step) => (
                  <li
                    key={step.step_id}
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-text-primary)",
                      padding: "0.3rem 0.45rem",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-surface-1)",
                    }}
                  >
                    {step.node_title}
                  </li>
                ))}
                {pendingSteps.length > 8 && (
                  <li style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", paddingLeft: "0.45rem" }}>
                    + {pendingSteps.length - 8} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {failedSteps.length > 0 && (
            <div style={{ fontSize: "0.78rem", color: "var(--color-danger, #e55353)" }}>
              {failedSteps.length} topic{failedSteps.length === 1 ? "" : "s"} failed
              {failedSteps[0]?.error_message ? ` — ${failedSteps[0].error_message}` : ""}
            </div>
          )}

          {terminal && (
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {batch.status === "completed"
                ? "All selected topics have been processed."
                : batch.status === "cancelled"
                  ? "Generation was cancelled."
                  : "Generation finished with errors."}
            </div>
          )}

          {!terminal && (
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={isCancelling}
              style={{
                justifySelf: "start",
                padding: "0.4rem 0.75rem",
                fontSize: "0.78rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "transparent",
                cursor: isCancelling ? "not-allowed" : "pointer",
              }}
            >
              {isCancelling ? "Cancelling…" : "Cancel batch"}
            </button>
          )}

          {!terminal && (
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              Browse freely while generation continues. Completed topics open in Material view when
              you select them.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
