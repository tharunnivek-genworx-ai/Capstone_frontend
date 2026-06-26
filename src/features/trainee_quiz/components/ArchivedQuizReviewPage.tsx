import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { traineeQuizService } from "../services/traineeQuizService";
import type { ArchivedQuizReviewOut } from "../types/traineeQuiz.types";
import { traineeSpaceUrl } from "../../trainee_study_material/utils/traineeSpaceNavigation";
import QuizRichText from "./QuizRichText";
import "../styles/traineeQuiz.css";

const ArchivedQuizReviewPage: React.FC = () => {
  const { spaceId, nodeId, quizId } = useParams<{
    spaceId: string;
    nodeId: string;
    quizId: string;
  }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<ArchivedQuizReviewOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId || !quizId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await traineeQuizService.reviewArchivedQuiz(nodeId, quizId);
        setReview(data);
      } catch (err) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load quiz review.");
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

  if (isLoading) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--loading">
        <span className="spinner" />
        <p>Loading archived quiz review…</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--error">
        <p>{error ?? "Quiz review not available."}</p>
        <button
          type="button"
          className="trainee-quiz-btn trainee-quiz-btn--secondary"
          onClick={handleBack}
        >
          Back to course
        </button>
      </div>
    );
  }

  return (
    <div className="trainee-quiz-results trainee-quiz-archive-review">
      <div className="trainee-quiz-results__card">
        <p className="trainee-quiz-results__eyebrow">Archived quiz review</p>
        <span className="topic-detail-panel__archive-reference-badge">Reference only</span>
        <h1 className="trainee-quiz-results__title">{review.title}</h1>
        <p className="trainee-quiz-archive-review__version">{review.version_label}</p>

        {review.is_partial_attempt && (
          <p className="trainee-quiz-archive-review__partial-note">
            This quiz was updated while you were taking it. Your saved answers below are a snapshot — this does not count toward completion.
          </p>
        )}

        {review.score_percent !== null && !review.is_partial_attempt && (
          <div className="trainee-quiz-results__score">
            <span className="trainee-quiz-results__score-value">{review.score_percent}%</span>
            <span className="trainee-quiz-results__score-label">Your best attempt on this version</span>
          </div>
        )}

        <p className="topic-detail-panel__archive-hint">
          For understanding — not required for completion.
        </p>

        <div className="trainee-quiz-archive-review__questions">
          {review.questions.map((question, index) => (
            <div key={question.question_id} className="trainee-quiz-archive-review__question">
              <h3>
                Question {index + 1}
                {!question.is_active && (
                  <span className="trainee-quiz-archive-review__removed"> (Removed)</span>
                )}
              </h3>
              <QuizRichText content={question.question_text} />
              <ul className="trainee-quiz-archive-review__options">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const text =
                    opt === "A"
                      ? question.option_a
                      : opt === "B"
                        ? question.option_b
                        : opt === "C"
                          ? question.option_c
                          : question.option_d;
                  if (!text) return null;
                  const isCorrect = question.correct_option === opt;
                  const isSelected = question.selected_option === opt;
                  return (
                    <li
                      key={opt}
                      className={`trainee-quiz-archive-review__option${
                        isCorrect ? " trainee-quiz-archive-review__option--correct" : ""
                      }${isSelected && !isCorrect ? " trainee-quiz-archive-review__option--wrong" : ""}`}
                    >
                      <strong>{opt}.</strong> <QuizRichText content={text} />
                      {isCorrect && <span className="trainee-quiz-archive-review__mark"> ✓</span>}
                    </li>
                  );
                })}
              </ul>
              {question.explanation && (
                <div className="trainee-quiz-archive-review__explanation">
                  <strong>Explanation:</strong>
                  <QuizRichText content={question.explanation} />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="trainee-quiz-btn trainee-quiz-btn--secondary"
          onClick={handleBack}
        >
          Back to course
        </button>
      </div>
    </div>
  );
};

export default ArchivedQuizReviewPage;
