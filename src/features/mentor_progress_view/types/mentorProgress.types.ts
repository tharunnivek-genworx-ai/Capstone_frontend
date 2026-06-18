export interface TraineeNodeProgressSummaryOut {
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

export interface TraineeSpaceSummaryOut {
  trainee_id: string;
  trainee_full_name: string;
  trainee_email: string;
  total_nodes: number;
  completed_nodes: number;
  overall_score_avg: number | null;
  overall_progress_percentage: number;
  last_activity_at: string | null;
  node_progress: TraineeNodeProgressSummaryOut[];
}

export interface MentorSpaceProgressOut {
  space_id: string;
  space_name: string;
  total_nodes: number;
  total_enrolled_trainees: number;
  trainees_with_no_activity: number;
  trainees: TraineeSpaceSummaryOut[];
}

export interface MentorSpaceProgressSummaryOut {
  space_id: string;
  space_name: string;
  total_nodes: number;
  total_enrolled_trainees: number;
}
