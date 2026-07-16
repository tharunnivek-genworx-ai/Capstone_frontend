import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuizAttempt } from "../hooks/useQuizAttempt";
import { traineeSpaceUrl } from "../../trainee_study_material/utils/traineeSpaceNavigation";
import toast from "react-hot-toast";
import QuestionNavigator from "./QuestionNavigator";
import QuizQuestionArea from "./QuizQuestionArea";
import "../styles/traineeQuiz.css";

const QuizAttemptPage: React.FC = () => {
  const { spaceId, attemptId } = useParams<{ spaceId: string; attemptId: string }>();
  const navigate = useNavigate();

  const attempt = useQuizAttempt({
    attemptId: attemptId ?? "",
    spaceId: spaceId ?? "",
  });

  const handleSaveExit = async () => {
    try {
      await attempt.flushNavigationState();
    } catch {
      toast.error("Could not save your quiz position. Please try again.");
      return;
    }
    const nodeId = attempt.quiz?.node_id;
    if (spaceId) navigate(traineeSpaceUrl(spaceId, nodeId));
    else navigate("/trainee/spaces");
  };

  const handleSubmitQuiz = async () => {
    const result = await attempt.submitQuiz();
    if (result && spaceId && attemptId) {
      navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${attemptId}/results`);
    }
  };

  useEffect(() => {
    if (attempt.quiz?.attempt_status === "submitted" && spaceId && attemptId) {
      navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${attemptId}/results`, { replace: true });
    }
  }, [attempt.quiz?.attempt_status, spaceId, attemptId, navigate]);

  useEffect(() => {
    if (!attempt.abandonedTarget || !spaceId || !attemptId) return;
    const { nodeId, quizId } = attempt.abandonedTarget;
    navigate(
      `/trainee/spaces/${spaceId}/nodes/${nodeId}/quiz/${quizId}/archive-review?attempt=${attemptId}`,
      { replace: true },
    );
  }, [attempt.abandonedTarget, spaceId, attemptId, navigate]);

  if (attempt.isLoading) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--loading">
        <span className="spinner" />
        <p>Loading quiz attempt…</p>
      </div>
    );
  }

  if (attempt.loadError || !attempt.quiz) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--error">
        <p>{attempt.loadError ?? "Quiz attempt not found."}</p>
        <button type="button" className="trainee-quiz-btn trainee-quiz-btn--secondary" onClick={() => void handleSaveExit()}>
          Back to course
        </button>
      </div>
    );
  }

  if (attempt.quiz.attempt_status === "submitted") {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--loading">
        <span className="spinner" />
        <p>Loading results…</p>
      </div>
    );
  }

  if (!attempt.currentQuestion || !attempt.currentState) {
    return (
      <div className="trainee-quiz-page trainee-quiz-page--error">
        <p>No questions available for this quiz.</p>
        <button type="button" className="trainee-quiz-btn trainee-quiz-btn--secondary" onClick={() => void handleSaveExit()}>
          Back to course
        </button>
      </div>
    );
  }

  return (
    <div className="trainee-quiz-page">
      <QuestionNavigator
        questions={attempt.questions}
        questionStates={attempt.questionStates}
        currentQuestionId={attempt.currentQuestionId}
        onSelect={attempt.selectQuestion}
      />
      <QuizQuestionArea
        quizTitle={attempt.quiz.title}
        question={attempt.currentQuestion}
        questionState={attempt.currentState}
        questionIndex={attempt.currentIndex}
        totalQuestions={attempt.activeQuestionCount}
        pendingSelection={attempt.pendingSelection}
        feedback={attempt.feedback}
        isSubmitting={attempt.isSubmittingAnswer}
        isReadOnly={false}
        onSelectOption={attempt.setPendingSelection}
        onClearSelection={attempt.clearSelection}
        onSubmitAnswer={attempt.submitAnswer}
        onSkip={attempt.skipQuestion}
        onPrevious={() => attempt.goToAdjacent(-1)}
        onNext={() => attempt.goToAdjacent(1)}
        onToggleFlag={attempt.toggleFlag}
        onExpandHints={attempt.expandHints}
        onShowNextHint={attempt.showNextHint}
        onCollapseHints={attempt.collapseHints}
        onSaveExit={() => void handleSaveExit()}
        onSubmitQuiz={handleSubmitQuiz}
        isSubmittingQuiz={attempt.isSubmittingQuiz}
      />
    </div>
  );
};

export default QuizAttemptPage;
