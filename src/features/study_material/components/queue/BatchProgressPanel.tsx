import { useState } from "react";
import { Check, ChevronDown, CircleAlert, LoaderCircle, X } from "lucide-react";
import type { BatchDetailOut, BatchStepOut } from "../../types/studyMaterialBatch.types";

interface BatchProgressPanelProps {
  batchDetail: BatchDetailOut;
  currentRunningStep: BatchStepOut | null;
  isPolling: boolean;
  error?: string | null;
  onCancel: () => Promise<void>;
  onClose: () => void;
}

export default function BatchProgressPanel({
  batchDetail,
  currentRunningStep,
  isPolling,
  error = null,
  onCancel,
  onClose,
}: BatchProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { batch, steps } = batchDetail;
  const terminal =
    batch.status === "completed" || batch.status === "failed" || batch.status === "cancelled";
  const finishedCount = batch.completed_steps + batch.failed_steps + batch.skipped_steps;
  const pendingSteps = steps.filter((step) => step.status === "pending");
  const failedSteps = steps.filter((step) => step.status === "failed");
  const percent = batch.total_steps > 0
    ? Math.round((finishedCount / batch.total_steps) * 100)
    : 0;

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await onCancel();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not cancel this queue.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <aside className="gsm-batch-panel" aria-label="Generate all progress">
      <div className="gsm-batch-panel__header">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="gsm-batch-panel__toggle"
          aria-expanded={isExpanded}
        >
          <div className={`gsm-batch-panel__status-icon${terminal ? " gsm-batch-panel__status-icon--done" : ""}`} aria-hidden>
            {terminal ? <Check size={16} /> : <LoaderCircle size={16} className="gsm-batch-panel__spin" />}
          </div>
          <div className="gsm-batch-panel__heading">
            <div>
            Generate all
            </div>
            <span>
            {finishedCount} / {batch.total_steps} done
            {pendingSteps.length > 0 && !terminal ? ` · ${pendingSteps.length} remaining` : ""}
            {isPolling ? " · updating" : ""}
            </span>
          </div>
          <ChevronDown className={isExpanded ? "gsm-batch-panel__chevron--open" : ""} size={17} aria-hidden />
        </button>
        {terminal && (
          <button type="button" className="gsm-batch-panel__close" onClick={onClose} aria-label="Close progress">
            <X size={17} />
          </button>
        )}
      </div>

      <div className="gsm-batch-panel__track" aria-label={`${percent}% complete`}>
        <span style={{ width: `${percent}%` }} />
      </div>

      {isExpanded && (
        <div className="gsm-batch-panel__body">
          {currentRunningStep && !terminal && (
            <div className="gsm-batch-panel__current">
              <span>Now generating</span>
              <strong>{currentRunningStep.node_title}</strong>
            </div>
          )}

          {pendingSteps.length > 0 && !terminal && (
            <div className="gsm-batch-panel__queue">
              <strong>Up next</strong>
              <ul>
                {pendingSteps.slice(0, 8).map((step) => (
                  <li key={step.step_id}>
                    {step.node_title}
                  </li>
                ))}
                {pendingSteps.length > 8 && (
                  <li className="gsm-batch-panel__more">
                    + {pendingSteps.length - 8} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {failedSteps.length > 0 && (
            <div className="gsm-batch-panel__failures">
              <CircleAlert size={15} aria-hidden />
              {failedSteps.length} topic{failedSteps.length === 1 ? "" : "s"} failed
              {failedSteps[0]?.error_message ? ` — ${failedSteps[0].error_message}` : ""}
            </div>
          )}

          {(error || cancelError) && (
            <div className="gsm-batch-panel__failures" role="alert">
              <CircleAlert size={15} aria-hidden />
              {cancelError ?? error}
            </div>
          )}

          {terminal && (
            <div className="gsm-batch-panel__terminal" role="status">
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
              className="as-button as-button--danger gsm-batch-panel__cancel"
            >
              {isCancelling ? "Cancelling…" : "Cancel batch"}
            </button>
          )}

          {!terminal && (
            <div className="gsm-batch-panel__note">
              Browse freely while generation continues. Completed topics open in Material view when
              you select them.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
