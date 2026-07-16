import React, { useState } from "react";
import type { TraineeOwnSpaceProgressOut } from "../types/traineeSpaceProgress.types";
import CircularProgressStat from "./CircularProgressStat";
import "../styles/learningProgress.css";

interface SpaceProgressPanelProps {
  progress: TraineeOwnSpaceProgressOut;
  onNavigateNode: (nodeId: string) => void;
}

const SpaceProgressPanel: React.FC<SpaceProgressPanelProps> = ({ progress, onNavigateNode }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="learning-progress">
      <div className="learning-progress__inner">
        <header className="learning-progress__header">
          <p className="learning-progress__eyebrow">Your learning</p>
          <h2 className="learning-progress__title">E-space progress</h2>
          <p className="learning-progress__subtitle">
            Track reading, quiz activity, and completion across every topic.
          </p>
        </header>

        <section className="learning-progress__card" aria-label="Overall progress summary">
          <div className="learning-progress__stats">
          <CircularProgressStat
            label="Overall completion"
            percentage={progress.overall_progress_percentage}
            valueLabel={`${progress.overall_progress_percentage}%`}
            color="var(--as-primary)"
          />
          <CircularProgressStat
            label="Quiz score average"
            percentage={progress.overall_score_percentage}
            valueLabel={
              progress.overall_score_percentage == null ? "N/A" : `${progress.overall_score_percentage}%`
            }
            color="var(--as-success)"
          />
          </div>
          <div className="learning-progress__metrics">
            <div>
              <p className="learning-progress__meta-label">Total topics</p>
              <p className="learning-progress__meta-value">{progress.total_nodes}</p>
            </div>
            <div>
              <p className="learning-progress__meta-label">Completed topics</p>
              <p className="learning-progress__meta-value">{progress.completed_nodes}</p>
            </div>
            <div>
              <p className="learning-progress__meta-label">Overall score average</p>
              <p className="learning-progress__meta-value">
                {progress.overall_score_avg == null ? "N/A" : progress.overall_score_avg.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="learning-progress__meta-label">Last activity</p>
              <p className="learning-progress__meta-value">
                {progress.last_activity_at
                  ? new Date(progress.last_activity_at).toLocaleString()
                  : "No activity yet"}
              </p>
            </div>
          </div>
        </section>

        <section className="learning-progress__section">
          <button
            type="button"
            className="learning-progress__section-toggle"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-controls="trainee-topic-progress"
          >
            <span className="learning-progress__toggle-label">Per topic breakdown</span>
            <span className="learning-progress__toggle-state">{expanded ? "Hide" : "Show"}</span>
          </button>
          {expanded && (
            <div id="trainee-topic-progress" className="learning-progress__list">
              {progress.node_progress.map((node) => (
                <button
                  key={node.node_id}
                  type="button"
                  className="learning-progress__topic"
                  onClick={() => onNavigateNode(node.node_id)}
                  style={{ paddingLeft: `${Math.max(0, node.node_level - 1) * 16 + 16}px` }}
                >
                  <span className="learning-progress__topic-head">
                    <span className="learning-progress__topic-title">{node.node_title}</span>
                    <span className="learning-progress__topic-value">{node.progress_percentage}%</span>
                  </span>
                  <span className="learning-progress__topic-meta">
                    {node.completion_status.replace("_", " ")} · Read {node.study_material_read_percent}% ·
                    Quiz attempts {node.quiz_attempt_count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SpaceProgressPanel;

