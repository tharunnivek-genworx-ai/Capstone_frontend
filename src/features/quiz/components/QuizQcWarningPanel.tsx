import React, { useState } from "react";
import type { QuizOut } from "../types/quiz.types";
import LlmDiagnosticsNotice from "../../study_material/components/shared/LlmDiagnosticsNotice";
import {
  formatQcScore,
  hasContentQcReport,
  isLlmGenerationFailure,
  isLlmRateLimited,
} from "../../study_material/utils/llmDiagnostics";

interface QuizQcWarningPanelProps {
  quiz: QuizOut;
  onAcceptDraft: () => void;
  onDeleteDraft: () => void;
}

const WarningIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" aria-hidden>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const QuizQcWarningPanel: React.FC<QuizQcWarningPanelProps> = ({
  quiz,
  onAcceptDraft,
  onDeleteDraft,
}) => {
  const [reportOpen, setReportOpen] = useState(false);
  const qcResult = quiz.qc_result;
  const llmFailure = isLlmGenerationFailure(qcResult);
  const rateLimited = isLlmRateLimited(qcResult);
  const showReport = !!(qcResult && hasContentQcReport(qcResult));

  return (
    <div className="study-material-qc-warning-panel study-material-qc-warning-panel--compact animate-fade-in">
      <div className="study-material-qc-warning-panel__card">
        <div className="qc-warning__title-row">
          <WarningIcon />
          <span className="qc-warning__title">
            {llmFailure ? "Generation Unavailable" : "Quality Check Failed"}
          </span>
        </div>
        <p className="qc-warning__body">
          {rateLimited
            ? "The quiz could not be generated because the AI service is temporarily unavailable. Review the placeholder on the left, then try again after the rate limit clears."
            : llmFailure
              ? "The quiz could not be generated because the AI service is temporarily unavailable. Review the draft on the left, then choose how to proceed."
              : "This quiz did not meet quality standards after 3 attempts. Review the questions on the left, then choose how to proceed."}
        </p>
        <LlmDiagnosticsNotice
          diagnostics={qcResult}
          entityNextLlmRetryAt={quiz.next_llm_retry_at}
        />

        {!rateLimited && (
          <div className="qc-warning__actions">
            <button type="button" className="btn-primary qc-warning__choice-btn" onClick={onAcceptDraft}>
              Continue with this draft
            </button>
            <button
              type="button"
              className="btn-secondary qc-warning__choice-btn qc-warning__choice-btn--danger"
              onClick={onDeleteDraft}
            >
              Delete draft & start over
            </button>
          </div>
        )}

        {showReport && (
          <button
            type="button"
            className="qc-warning__report-toggle"
            onClick={() => setReportOpen((open) => !open)}
            aria-expanded={reportOpen}
          >
            {reportOpen ? "Hide QC details" : "Show QC details"}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              className={reportOpen ? "qc-warning__chevron--open" : undefined}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {showReport && reportOpen && qcResult && (
        <div className="study-material-qc-warning-panel__report">
          <span className="qc-warning__report-title">QC Evaluation Report</span>

          <div className="qc-warning__scores">
            <span className="qc-warning__scores-label">Scores</span>
            <div className="qc-warning__scores-grid">
              <div>Answer Correctness: <strong>{formatQcScore(qcResult.scores?.answer_correctness)}</strong></div>
              <div>Relevance: <strong>{formatQcScore(qcResult.scores?.topic_relevance)}</strong></div>
              <div>Option Quality: <strong>{formatQcScore(qcResult.scores?.option_quality)}</strong></div>
              <div>Clarity: <strong>{formatQcScore(qcResult.scores?.question_clarity)}</strong></div>
              <div>Difficulty Alignment: <strong>{formatQcScore(qcResult.scores?.difficulty_alignment)}</strong></div>
              <div>Explanation Quality: <strong>{formatQcScore(qcResult.scores?.explanation_quality)}</strong></div>
              <div className="qc-warning__scores-grid--span">Duplicate/Overlap: <strong>{formatQcScore(qcResult.scores?.duplicate_overlap)}</strong></div>
            </div>
          </div>

          <div className="qc-warning__divider" />

          <div className="qc-warning__risk-row">
            <span>Wrong Answer Risk:</span>
            <span className={`qc-warning__risk-value qc-warning__risk-value--${qcResult.wrong_answer_risk ?? "unknown"}`}>
              {qcResult.wrong_answer_risk?.toUpperCase() ?? "UNKNOWN"}
            </span>
          </div>

          {(qcResult.flagged_questions?.length ?? 0) > 0 && (
            <div className="qc-warning__issues">
              <span className="qc-warning__issues-label">Flagged Questions</span>
              <ul>
                {qcResult.flagged_questions?.map((flaggedQ, idx) => (
                  <li key={idx}>
                    Question {flaggedQ.question_number}: {flaggedQ.flags.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(qcResult.issues?.length ?? 0) > 0 && (
            <div className="qc-warning__issues">
              <span className="qc-warning__issues-label">General Issues</span>
              <ul>
                {qcResult.issues?.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {qcResult.corrective_instructions && (
            <div className="qc-warning__corrective">
              <span className="qc-warning__corrective-label">Corrective Action</span>
              <p>{qcResult.corrective_instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizQcWarningPanel;
