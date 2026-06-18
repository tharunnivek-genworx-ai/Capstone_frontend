export interface TraineeNodeProgressSummary {
  node_id: string;
  node_title: string;
  node_level: number;
  is_active: boolean;
  study_material_completed: boolean;
  study_material_read_percent: number;
  quiz_passed: boolean;
  quiz_best_score: number | null;
  quiz_attempt_count: number;
  completion_status: "not_started" | "in_progress" | "completed";
  progress_percentage: number;
  last_viewed_at: string | null;
  updated_at: string;
}

export interface TraineeOwnSpaceProgressOut {
  space_id: string;
  space_name: string;
  trainee_id: string;
  total_nodes: number;
  completed_nodes: number;
  overall_progress_percentage: number;
  overall_score_avg: number | null;
  overall_score_percentage: number | null;
  last_activity_at: string | null;
  node_progress: TraineeNodeProgressSummary[];
}

