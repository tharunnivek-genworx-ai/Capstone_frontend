import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { traineeQuizService } from "../services/traineeQuizService";
import type { TraineeQuizOut } from "../types/traineeQuiz.types";
import { traineeSpaceUrl } from "../../trainee_study_material/utils/traineeSpaceNavigation";
import QuizRichText from "./QuizRichText";
import "../styles/traineeQuiz.css";

const QuizAttemptResultsPage: React.FC = () => {
  const { spaceId, attemptId } = useParams<{ spaceId: string; attemptId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<TraineeQuizOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const quizData = await traineeQuizService.getAttempt(attemptId);
        setQuiz(quizData);
      } catch (err) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load results.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [attemptId]);

  const handleBack = () => {
    if (spaceId) navigate(traineeSpaceUrl(spaceId, quiz?.node_id));
    else navigate("/trainee/spaces");
  };

  if (isLoading) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--loading">
        <span className="spinner" />
        <p>Loading results…</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--error">
        <p>{error ?? "Results not available."}</p>
        <button type="button" className="trainee-quiz-btn trainee-quiz-btn--secondary" onClick={handleBack}>
          Back to course
        </button>
      </div>
    );
  }

  const scorePercent = quiz.score_percent ?? 0;
  const totalCorrect = quiz.total_correct ?? 0;
  const totalSkipped = quiz.total_skipped ?? 0;
  const bestScorePercent = quiz.best_score_percent ?? scorePercent;

  return (
    <div className="trainee-quiz-results">
      <div className="trainee-quiz-results__card">
        <p className="trainee-quiz-results__eyebrow">Quiz complete</p>
        <h1 className="trainee-quiz-results__title">{quiz.title}</h1>

        <div className="trainee-quiz-results__score">
          <span className="trainee-quiz-results__score-value">{scorePercent}%</span>
          <span className="trainee-quiz-results__score-label">
            {totalCorrect} of {quiz.total_questions} correct
          </span>
        </div>
        <div
          className={`trainee-quiz-results__pass-status ${
            quiz.has_met_pass_threshold
              ? "trainee-quiz-results__pass-status--passed"
              : "trainee-quiz-results__pass-status--not-passed"
          }`}
          role="status"
        >
          <strong>
            {quiz.has_met_pass_threshold ? "Pass requirement met" : "Keep trying"}
          </strong>
          <span>
            Required: {quiz.pass_threshold_percent}% · Best score: {bestScorePercent}%
          </span>
        </div>

        <div className="trainee-quiz-results__stats">
          <div>
            <strong>{totalSkipped}</strong>
            <span>Skipped</span>
          </div>
        </div>

        <div className="trainee-quiz-results__review">
          <h2>Review answers</h2>
          {quiz.questions
            .filter((q) => q.is_active)
            .sort((a, b) => a.order_index - b.order_index)
            .map((q, index) => (
              <div key={q.question_id} className="trainee-quiz-results__question">
                <div className="trainee-quiz-results__question-header">
                  <span>Q{index + 1}</span>
                  {q.is_correct ? (
                    <span className="trainee-quiz-results__badge trainee-quiz-results__badge--correct">
                      Correct
                    </span>
                  ) : q.was_skipped ? (
                    <span className="trainee-quiz-results__badge trainee-quiz-results__badge--skipped">
                      Skipped
                    </span>
                  ) : (
                    <span className="trainee-quiz-results__badge trainee-quiz-results__badge--incorrect">
                      Incorrect
                    </span>
                  )}
                </div>
                <QuizRichText content={q.question_text} />
                {q.correct_option && (
                  <p className="trainee-quiz-results__answer">
                    Correct answer: <strong>{q.correct_option}</strong>
                    {q.selected_option && (
                      <>
                        {" "}
                        · Your answer: <strong>{q.selected_option}</strong>
                      </>
                    )}
                  </p>
                )}
                {q.explanation && (
                  <div className="trainee-quiz-results__explanation">
                    <QuizRichText content={q.explanation} />
                  </div>
                )}
              </div>
            ))}
        </div>

        <div className="trainee-quiz-results__actions">
          <button
            type="button"
            className="trainee-quiz-btn trainee-quiz-btn--secondary"
            onClick={() =>
              navigate(
                `/trainee/spaces/${spaceId}/nodes/${quiz.node_id}/quiz/${quiz.quiz_id}/attempts`,
              )
            }
          >
            View all attempts
          </button>
          <button type="button" className="trainee-quiz-btn trainee-quiz-btn--primary" onClick={handleBack}>
            Back to course
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptResultsPage;
