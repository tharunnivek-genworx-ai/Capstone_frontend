import React from "react";
import type { HintGenerationDiagnosticsOut } from "../types/quiz.types";
import LlmDiagnosticsNotice from "../../study_material/components/shared/LlmDiagnosticsNotice";
import {
  LLM_ERROR_LABELS,
  resolveNextLlmRetryAt,
} from "../../study_material/utils/llmDiagnostics";

interface HintGenerationDiagnosticsPanelProps {
  hintGeneration: HintGenerationDiagnosticsOut;
  entityNextLlmRetryAt?: string | null;
  questionsById: Map<string, { index: number; text: string }>;
  onNavigateQuestion?: (questionId: string) => void;
}

const HintGenerationDiagnosticsPanel: React.FC<
  HintGenerationDiagnosticsPanelProps
> = ({ hintGeneration, entityNextLlmRetryAt, questionsById, onNavigateQuestion }) => {
  const questionErrors = hintGeneration.questionErrors ?? [];
  const hasQuestionErrors = questionErrors.length > 0;
  const hasTopLevelError = !!hintGeneration.errorType;
  const retryAt = resolveNextLlmRetryAt(entityNextLlmRetryAt, hintGeneration);

  if (!hasTopLevelError && !hasQuestionErrors && !retryAt) return null;

  return (
    <section className="quiz-diagnostics" role="status" aria-label="Hint generation diagnostics">
      <div className="quiz-diagnostics__summary">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d97706"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <strong>Some hints need attention</strong>
          <span>Review the generation details before retrying or publishing.</span>
        </div>
      </div>

      <div className="quiz-diagnostics__body">
        <LlmDiagnosticsNotice
          diagnostics={hintGeneration}
          entityNextLlmRetryAt={entityNextLlmRetryAt}
        />

        {hasQuestionErrors && (
          <div className="quiz-diagnostics__questions">
            <span>Questions without complete, valid hints</span>
            <ul>
              {questionErrors.map((entry) => {
                const question = questionsById.get(entry.question_id);
                const label = question
                  ? `Q${question.index + 1}: ${question.text}`
                  : `Question ${entry.question_id}`;
                const errorLabel = LLM_ERROR_LABELS[entry.errorType];
                return (
                  <li key={entry.question_id}>
                    {onNavigateQuestion && question ? (
                      <button
                        type="button"
                        className="quiz-hint-card__question-link"
                        onClick={() => onNavigateQuestion(entry.question_id)}
                      >
                        {label}
                      </button>
                    ) : label}
                    {" — "}{errorLabel}
                    {entry.attempts > 1 ? ` (${entry.attempts} attempts)` : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default HintGenerationDiagnosticsPanel;
