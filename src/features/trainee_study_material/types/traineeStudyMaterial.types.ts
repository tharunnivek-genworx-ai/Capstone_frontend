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
