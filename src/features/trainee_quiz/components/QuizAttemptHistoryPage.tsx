import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { traineeQuizService } from "../services/traineeQuizService";
import type { TraineeQuizAttemptListOut } from "../types/traineeQuiz.types";
import { traineeSpaceUrl } from "../../trainee_study_material/utils/traineeSpaceNavigation";
import { parseAttemptError } from "../utils/attemptErrors";
import "../styles/traineeQuiz.css";

const QuizAttemptHistoryPage: React.FC = () => {
  const { spaceId, nodeId, quizId } = useParams<{
    spaceId: string;
    nodeId: string;
    quizId: string;
  }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TraineeQuizAttemptListOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId || !quizId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await traineeQuizService.listAttempts(nodeId, quizId);
        setData(result);
      } catch (err) {
        setError(parseAttemptError(err, "Failed to load attempts.").message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [nodeId, quizId]);

  const handleBack = () => {
    if (spaceId) navigate(traineeSpaceUrl(spaceId, nodeId));
    else navigate("/trainee/spaces");
  };

  const handleOpenAttempt = (attemptId: string, status: string) => {
    if (status === "submitted") {
      navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${attemptId}/results`);
      return;
    }
    if (status === "abandoned") {
      navigate(
        `/trainee/spaces/${spaceId}/nodes/${nodeId}/quiz/${quizId}/archive-review?attempt=${attemptId}`,
      );
      return;
    }
    navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${attemptId}`);
  };

  if (isLoading) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--loading">
        <span className="spinner" />
        <p>Loading your attempts…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--error">
        <p>{error ?? "No attempts found."}</p>
        <button type="button" className="trainee-quiz-btn trainee-quiz-btn--secondary" onClick={handleBack}>
          Back to course
        </button>
      </div>
    );
  }

  return (
    <div className="trainee-quiz-history">
      <div className="trainee-quiz-history__header">
        <button type="button" className="trainee-quiz-btn trainee-quiz-btn--ghost" onClick={handleBack}>
          ← Back to course
        </button>
        <h1>{data.title}</h1>
        <p>Your quiz attempts, newest first</p>
      </div>

      {data.attempts.length === 0 ? (
        <p className="trainee-quiz-history__empty">No attempts yet.</p>
      ) : (
        <div className="trainee-quiz-history__grid">
          {data.attempts.map((attempt) => (
            <button
              key={attempt.attempt_id}
              type="button"
              className="trainee-quiz-history__card"
              onClick={() => handleOpenAttempt(attempt.attempt_id, attempt.status)}
            >
              <div className="trainee-quiz-history__card-top">
                <span className={`trainee-quiz-history__status trainee-quiz-history__status--${attempt.status}`}>
                  {attempt.status === "in_progress"
                    ? "In progress"
                    : attempt.status === "abandoned"
                      ? "Archived"
                      : "Submitted"}
                </span>
                {attempt.score_percent != null && (
                  <span className="trainee-quiz-history__score">{attempt.score_percent}%</span>
                )}
              </div>
              <p className="trainee-quiz-history__label">{attempt.attempt_label}</p>
              {attempt.status === "submitted" && (
                <p className="trainee-quiz-history__meta">
                  {attempt.total_correct ?? 0} of {attempt.total_questions} correct
                  {(attempt.total_skipped ?? 0) > 0 ? ` · ${attempt.total_skipped} skipped` : ""}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizAttemptHistoryPage;
