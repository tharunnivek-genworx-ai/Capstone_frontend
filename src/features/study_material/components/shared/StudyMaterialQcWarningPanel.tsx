import React, { useState } from "react";
import type {
  DetFailureDisplayOut,
  QcWarningPresentationOut,
  StudyMaterialVersionOut,
} from "../../types/studyMaterial.types";
import LlmDiagnosticsNotice from "./LlmDiagnosticsNotice";
import {
  formatQcScore,
  hasContentQcReport,
  isLlmGenerationFailure,
  isLlmRateLimited,
} from "../../utils/llmDiagnostics";
import {
  QC_LLM_FAILED_BODY,
  QC_LLM_FAILED_TITLE,
  shouldShowCodeQualityScore,
} from "../../utils/qcDisplayUtils";

interface StudyMaterialQcWarningPanelProps {
  activeVersion: StudyMaterialVersionOut;
  onAcceptDraft: () => Promise<void>;
  onDiscardDrafts: () => void;
  canDiscardDrafts?: boolean;
  discardBlockReason?: string | null;
}

function DetFailureList({
  label,
  items,
}: {
  label: string;
  items: DetFailureDisplayOut[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="sm-qc-warning__issues sm-qc-warning__issues--det">
      <span className="sm-qc-warning__issues-label">{label}</span>
      <ul>
        {items.map((item) => (
          <li key={`${item.check_id}-${item.section_label}-${item.subsection_label ?? ""}`}>
            {item.user_message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetFailureReportSections({
  presentation,
}: {
  presentation: QcWarningPresentationOut;
}) {
  const {
    kind,
    formatting_items,
    structure_items,
    evidence_items,
    formatting_list_label,
    structure_list_label,
    evidence_list_label,
    det_only_list_label,
  } = presentation;

  if (kind === "mixed") {
    return (
      <>
        <DetFailureList label={formatting_list_label} items={formatting_items} />
        <DetFailureList label={structure_list_label} items={structure_items} />
        <DetFailureList label={evidence_list_label} items={evidence_items} />
      </>
    );
  }

  const allItems = [...structure_items, ...evidence_items, ...formatting_items];
  return <DetFailureList label={det_only_list_label} items={allItems} />;
}

const StudyMaterialQcWarningPanel: React.FC<StudyMaterialQcWarningPanelProps> = ({
  activeVersion,
  onAcceptDraft,
  onDiscardDrafts,
  canDiscardDrafts = true,
  discardBlockReason = null,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const qcResult = activeVersion.qc_result;
  const llmFailure = isLlmGenerationFailure(qcResult);
  const rateLimited = isLlmRateLimited(qcResult);
  const showCodeQuality = shouldShowCodeQualityScore(activeVersion.concept_plan?.domain);
  const warningPresentation = qcResult?.warning_presentation ?? null;
  const displayIssues = qcResult?.humanized_issues ?? qcResult?.issues ?? [];
  const displayCorrective =
    qcResult?.humanized_corrective_instructions ?? qcResult?.corrective_instructions ?? "";

  const alertTitle = rateLimited
    ? "Generation Unavailable"
    : llmFailure
      ? "Generation Unavailable"
      : warningPresentation?.alert_title ?? QC_LLM_FAILED_TITLE;

  const alertBody = rateLimited
    ? "Study material could not be generated because the AI service is temporarily unavailable. Inspect the placeholder draft on the left, then try again after the rate limit clears."
    : llmFailure
      ? "Study material could not be generated because the AI service is temporarily unavailable. Inspect the placeholder draft on the left before deciding how to proceed."
      : warningPresentation?.alert_body ?? QC_LLM_FAILED_BODY;

  const isDetFormattingOnly = warningPresentation?.is_formatting_only ?? false;

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      await onAcceptDraft();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="study-material-qc-warning-panel animate-fade-in">
      <div className="study-material-qc-warning-panel__sticky">
        <div
          className={`study-material-qc-warning-panel__alert${
            isDetFormattingOnly ? " study-material-qc-warning-panel__alert--formatting" : ""
          }`}
        >
          <div className="sm-qc-warning__title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" aria-hidden>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="sm-qc-warning__title">{alertTitle}</span>
          </div>
          <p className="sm-qc-warning__body">{alertBody}</p>
          {warningPresentation?.det_summary && !rateLimited && !llmFailure && (
            <p className="sm-qc-warning__det-summary">{warningPresentation.det_summary}</p>
          )}
          <LlmDiagnosticsNotice
            diagnostics={qcResult}
            entityNextLlmRetryAt={activeVersion.next_llm_retry_at}
          />
        </div>

        {!rateLimited && (
          <div className="study-material-qc-warning-panel__choices">
            <span className="sm-qc-warning__choices-label">How do you want to proceed?</span>
            <div className="sm-qc-warning__choices">
              <button
                type="button"
                className="btn-primary sm-qc-warning__choice-btn"
                onClick={() => void handleAccept()}
                disabled={isAccepting}
              >
                {isAccepting ? "Accepting…" : "Continue with this draft"}
              </button>
              <button
                type="button"
                className="btn-secondary sm-qc-warning__choice-btn sm-qc-warning__choice-btn--danger"
                onClick={onDiscardDrafts}
                disabled={!canDiscardDrafts || isAccepting}
                title={!canDiscardDrafts ? discardBlockReason ?? "Drafts cannot be discarded yet" : undefined}
              >
                Discard unpublished drafts
              </button>
            </div>
          </div>
        )}
      </div>

      {qcResult && hasContentQcReport(qcResult) && (
        <div className="study-material-qc-warning-panel__report">
          <span className="sm-qc-warning__report-title">QC Evaluation Report</span>

          <div className="sm-qc-warning__scores">
            <span className="sm-qc-warning__scores-label">Scores:</span>
            <div className="sm-qc-warning__scores-grid">
              <div>Accuracy: <strong>{formatQcScore(qcResult.scores?.content_accuracy)}</strong></div>
              {showCodeQuality && (
                <div>Code Quality: <strong>{formatQcScore(qcResult.scores?.code_quality)}</strong></div>
              )}
              <div>Section Depth: <strong>{formatQcScore(qcResult.scores?.section_depth)}</strong></div>
              <div>Alignment: <strong>{formatQcScore(qcResult.scores?.teaching_alignment)}</strong></div>
            </div>
            {qcResult.verification_mode === "targeted" && qcResult.scores?.teaching_alignment != null && (
              <p className="sm-qc-warning__scores-note">
                Alignment score from prior full verification pass.
              </p>
            )}
          </div>

          {warningPresentation?.reassurance && (
            <p className="sm-qc-warning__reassurance">{warningPresentation.reassurance}</p>
          )}

          <div className="sm-qc-warning__divider" />

          <div className="sm-qc-warning__risk-row">
            <span>Hallucination Risk:</span>
            <span
              className={`sm-qc-warning__risk-value sm-qc-warning__risk-value--${qcResult.hallucination_risk ?? "unknown"}`}
            >
              {qcResult.hallucination_risk?.toUpperCase() ?? "UNKNOWN"}
            </span>
          </div>

          {warningPresentation && (
            <DetFailureReportSections presentation={warningPresentation} />
          )}

          {displayIssues.length > 0 && (
            <div className="sm-qc-warning__issues">
              <span className="sm-qc-warning__issues-label">
                {warningPresentation?.content_issues_label ?? "Issues Found"}
              </span>
              <ul>
                {displayIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {displayCorrective && (
            <div className="sm-qc-warning__corrective">
              <span className="sm-qc-warning__corrective-label">Corrective Action:</span>
              <p>{displayCorrective}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyMaterialQcWarningPanel;
