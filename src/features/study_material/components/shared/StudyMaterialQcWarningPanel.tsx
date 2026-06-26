import React from "react";
import type { StudyMaterialVersionOut } from "../../types/studyMaterial.types";
import LlmDiagnosticsNotice from "./LlmDiagnosticsNotice";
import {
  formatQcScore,
  hasContentQcReport,
  isLlmGenerationFailure,
} from "../../utils/llmDiagnostics";

interface StudyMaterialQcWarningPanelProps {
  activeVersion: StudyMaterialVersionOut;
  onAcceptDraft: () => void;
  onDiscardDrafts: () => void;
}

const StudyMaterialQcWarningPanel: React.FC<StudyMaterialQcWarningPanelProps> = ({
  activeVersion,
  onAcceptDraft,
  onDiscardDrafts,
}) => {
  const qcResult = activeVersion.qc_result;
  const llmFailure = isLlmGenerationFailure(qcResult);

  return (
    <div className="study-material-qc-warning-panel animate-fade-in">
      <div className="study-material-qc-warning-panel__sticky">
        <div className="study-material-qc-warning-panel__alert">
          <div className="sm-qc-warning__title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" aria-hidden>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="sm-qc-warning__title">
              {llmFailure ? "Generation Unavailable" : "Quality Check Failed"}
            </span>
          </div>
          <p className="sm-qc-warning__body">
            {llmFailure
              ? "Study material could not be generated because the AI service is temporarily unavailable. Inspect the placeholder draft on the left before deciding how to proceed."
              : "This generated study material did not meet quality standards after 3 attempts. Please inspect the draft on the left before deciding how to proceed."}
          </p>
          <LlmDiagnosticsNotice
            diagnostics={qcResult}
            entityNextLlmRetryAt={activeVersion.next_llm_retry_at}
          />
        </div>

        <div className="study-material-qc-warning-panel__choices">
          <span className="sm-qc-warning__choices-label">How do you want to proceed?</span>
          <div className="sm-qc-warning__choices">
            <button type="button" className="btn-primary sm-qc-warning__choice-btn" onClick={onAcceptDraft}>
              Continue with this draft
            </button>
            <button
              type="button"
              className="btn-secondary sm-qc-warning__choice-btn sm-qc-warning__choice-btn--danger"
              onClick={onDiscardDrafts}
            >
              Discard unpublished drafts
            </button>
          </div>
        </div>
      </div>

      {qcResult && hasContentQcReport(qcResult) && (
        <div className="study-material-qc-warning-panel__report">
          <span className="sm-qc-warning__report-title">QC Evaluation Report</span>

          <div className="sm-qc-warning__scores">
            <span className="sm-qc-warning__scores-label">Scores:</span>
            <div className="sm-qc-warning__scores-grid">
              <div>Accuracy: <strong>{formatQcScore(qcResult.scores?.content_accuracy)}</strong></div>
              <div>Code Quality: <strong>{formatQcScore(qcResult.scores?.code_quality)}</strong></div>
              <div>Section Depth: <strong>{formatQcScore(qcResult.scores?.section_depth)}</strong></div>
              <div>Alignment: <strong>{formatQcScore(qcResult.scores?.teaching_alignment)}</strong></div>
            </div>
            {qcResult.verification_mode === "targeted" && qcResult.scores?.teaching_alignment != null && (
              <p className="sm-qc-warning__scores-note">
                Alignment score from prior full verification pass.
              </p>
            )}
          </div>

          <div className="sm-qc-warning__divider" />

          <div className="sm-qc-warning__risk-row">
            <span>Hallucination Risk:</span>
            <span
              className={`sm-qc-warning__risk-value sm-qc-warning__risk-value--${qcResult.hallucination_risk ?? "unknown"}`}
            >
              {qcResult.hallucination_risk?.toUpperCase() ?? "UNKNOWN"}
            </span>
          </div>

          {(qcResult.issues?.length ?? 0) > 0 && (
            <div className="sm-qc-warning__issues">
              <span className="sm-qc-warning__issues-label">Issues Found:</span>
              <ul>
                {qcResult.issues?.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {qcResult.corrective_instructions && (
            <div className="sm-qc-warning__corrective">
              <span className="sm-qc-warning__corrective-label">Corrective Action:</span>
              <p>{qcResult.corrective_instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyMaterialQcWarningPanel;
