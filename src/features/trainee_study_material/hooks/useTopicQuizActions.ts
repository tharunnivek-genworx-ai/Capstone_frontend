import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import type { QuizPanelActions } from "../types/traineeNodePanel.types";
import { traineeQuizService } from "../../trainee_quiz/services/traineeQuizService";

interface UseTopicQuizActionsParams {
  spaceId: string;
  nodeId: string;
  quizActions: QuizPanelActions | null | undefined;
}

/** Navigation handlers for quiz CTAs — labels and visibility come from the panel API. */
export function useTopicQuizActions({
  spaceId,
  nodeId,
  quizActions,
}: UseTopicQuizActionsParams) {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleTakeQuiz = async () => {
    if (!quizActions?.quiz_id) return;

    if (quizActions.active_attempt_id) {
      navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${quizActions.active_attempt_id}`);
      return;
    }

    if (!quizActions.can_start_new_attempt) {
      toast.error("You cannot start a new quiz attempt right now.");
      return;
    }

    setIsStarting(true);
    try {
      const attempt = await traineeQuizService.startAttempt(nodeId, quizActions.quiz_id);
      navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${attempt.attempt_id}`);
    } catch (err) {
      const e = err as {
        response?: { data?: { detail?: string | { active_attempt_id?: string } } };
        message?: string;
      };
      const detail = e?.response?.data?.detail;
      if (typeof detail === "object" && detail?.active_attempt_id) {
        navigate(`/trainee/spaces/${spaceId}/quiz/attempt/${detail.active_attempt_id}`);
        return;
      }
      toast.error(typeof detail === "string" ? detail : e?.message ?? "Could not start quiz.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleViewAttempts = () => {
    if (!quizActions?.quiz_id) return;
    navigate(
      `/trainee/spaces/${spaceId}/nodes/${nodeId}/quiz/${quizActions.quiz_id}/attempts`,
    );
  };

  return {
    isStartingQuiz: isStarting,
    handleTakeQuiz,
    handleViewAttempts,
  };
}
