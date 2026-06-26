export interface TraineeStudyMaterialOut {
  version_id: string;
  node_id: string;
  space_id: string;
  version_number: number;
  content: string;
  reference_material_id: string | null;
  published_at: string | null;
  study_material_read_percent: number;
  study_material_completed: boolean;
}

export interface StudyMaterialProgressUpdateRequest {
  read_percent: number;
}

export interface StudyMaterialProgressOut {
  node_id: string;
  study_material_viewed: boolean;
  study_material_read_percent: number;
  study_material_completed: boolean;
  completion_status: string;
}

export interface TraineeArchivedSmItem {
  version_id: string;
  version_number: number;
  version_label: string;
  published_at: string | null;
  superseded_at: string | null;
  you_read_this: boolean;
  has_archived_quiz: boolean;
  archived_quiz_id: string | null;
  is_current_version?: boolean;
}

export interface TraineeArchivedSmListOut {
  node_id: string;
  versions: TraineeArchivedSmItem[];
}

export interface TraineeArchivedStudyMaterialOut {
  version_id: string;
  node_id: string;
  space_id: string;
  version_number: number;
  version_label: string;
  content: string;
  reference_material_id: string | null;
  published_at: string | null;
  superseded_at: string | null;
  is_archived_reference: boolean;
}
