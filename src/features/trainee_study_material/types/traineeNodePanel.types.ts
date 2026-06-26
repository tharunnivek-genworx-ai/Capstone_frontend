export type NodePanelType =
  | "pure-parent"
  | "mixed-parent"
  | "leaf-available"
  | "leaf-locked";

export type SubtopicBadgeKind = "available" | "in_progress" | "completed" | "locked";
export type QuizBadgeKind = "none" | "not_taken" | "in_progress" | "completed";
export type QuizButtonVariant = "primary" | "secondary";
export type MixedParentTab = "study" | "subtopics";

export interface BreadcrumbItem {
  node_id: string;
  title: string;
}

export interface NavSuggestion {
  node_id: string;
  title: string;
  label_prefix?: string;
}

export interface SubtopicPanelItem {
  node_id: string;
  title: string;
  is_published: boolean;
  lesson_count: number;
  child_count: number;
  meta_label: string;
  badge_kind: SubtopicBadgeKind;
  badge_label: string;
}

export interface QuizPanelActions {
  show_quiz_button: boolean;
  quiz_id: string | null;
  active_attempt_id: string | null;
  can_start_new_attempt: boolean;
  quiz_button_label: string;
  quiz_button_variant: QuizButtonVariant;
  show_attempts_button: boolean;
  attempts_button_label: string;
  review_notice?: string | null;
}

export interface StudyMaterialSummary {
  content_preview: string;
  read_time_minutes: number;
  read_percent: number;
  is_fully_read: boolean;
  quiz_available: boolean;
  quiz_passed: boolean;
  quiz_badge_kind: QuizBadgeKind;
  quiz_badge_label: string | null;
  reading_button_label: string;
  quiz_actions: QuizPanelActions | null;
  completion_status: "not_started" | "in_progress" | "completed";
  progress_percentage: number;
}

export interface OverallProgress {
  completed_units: number;
  total_units: number;
  percentage: number;
  label: string;
}

export interface ArchiveSummary {
  has_previous_versions: boolean;
  archived_version_count: number;
  show_upgrade_banner: boolean;
}

export interface TraineeTopicResource {
  media_id: string;
  media_type: "image" | "pdf" | "video_url" | "article_link";
  type_label: string;
  display_title: string;
  subtitle: string | null;
  view_action_label: string;
  download_action_label: string | null;
  view_url: string;
  download_url: string | null;
  download_filename: string | null;
  mime_type: string | null;
  is_downloadable: boolean;
  order_index: number;
}

export type MaterialTab = "current" | "previous";

export interface TraineeNodePanelOut {
  panel_type: NodePanelType;
  title: string;
  header_meta: string;
  study_material: StudyMaterialSummary | null;
  subtopics: SubtopicPanelItem[];
  availability_summary: string | null;
  children_progress_label: string | null;
  breadcrumbs: BreadcrumbItem[];
  back_navigation: NavSuggestion | null;
  sibling_suggestions: NavSuggestion[];
  next_up: NavSuggestion | null;
  overall_progress: OverallProgress | null;
  default_tab: MixedParentTab | null;
  all_subtopics_locked: boolean;
  is_fully_complete: boolean;
  archive_summary: ArchiveSummary | null;
  topic_resources: TraineeTopicResource[];
  topic_resources_section_title: string;
  topic_resources_empty_message: string;
}
