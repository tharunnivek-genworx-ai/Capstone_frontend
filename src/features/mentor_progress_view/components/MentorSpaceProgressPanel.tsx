import React, { useState } from "react";
import type {
  MentorSpaceProgressOut,
  TraineeSpaceSummaryOut,
} from "../types/mentorProgress.types";
import "../../trainee_space_progress/styles/learningProgress.css";

interface MentorSpaceProgressPanelProps {
  progress: MentorSpaceProgressOut;
  onNavigateNode?: (nodeId: string) => void;
}

const MentorSpaceProgressPanel: React.FC<MentorSpaceProgressPanelProps> = ({
  progress,
  onNavigateNode,
}) => {
  const [expandedTraineeId, setExpandedTraineeId] = useState<string | null>(null);
  const [detailModalTrainee, setDetailModalTrainee] = useState<TraineeSpaceSummaryOut | null>(
    null
  );

  const toggleExpand = (traineeId: string) => {
    setExpandedTraineeId((prev) => (prev === traineeId ? null : traineeId));
  };

  const formatScore = (score: number | null) => {
    if (score == null) return "N/A";
    return `${Math.round(score * 100)}%`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No activity yet";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="learning-progress mentor-learning-progress" style={{ padding: "1.5rem", overflowY: "auto", height: "100%", background: "#f8fafc" }}>
      {/* ── Section A: Space-Level Metrics (At-a-Glance) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Metric Card 1: Space Name & Total Nodes */}
        <div
          className="learning-progress__card"
          style={{
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(37,99,235,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500, textTransform: "uppercase" }}>
              Total Study Topics
            </p>
            <h3 style={{ margin: "2px 0 0", fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {progress.total_nodes}
            </h3>
          </div>
        </div>

        {/* Metric Card 2: Enrolled Trainees */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(16,185,129,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Enrolled Learners
            </p>
            <h3 style={{ margin: "2px 0 0", fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {progress.total_enrolled_trainees}
            </h3>
          </div>
        </div>

        {/* Metric Card 3: Inactive Trainees */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245,158,11,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f59e0b",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Inactive (No Activity)
            </p>
            <h3 style={{ margin: "2px 0 0", fontSize: "1.5rem", fontWeight: 800, color: "#d97706" }}>
              {progress.trainees_with_no_activity}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Section B: Trainee Cards/Rows (Space-Level Rollup) ── */}
      <div>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "1rem",
          }}
        >
          Learner Progress Rollup
        </h3>

        {progress.trainees.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              background: "#fff",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              color: "var(--color-text-muted)",
            }}
          >
            No trainees enrolled in this space yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {progress.trainees.map((trainee) => {
              const isExpanded = expandedTraineeId === trainee.trainee_id;

              return (
                <div
                  key={trainee.trainee_id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "16px",
                    boxShadow: "var(--shadow-subtle)",
                    transition: "all 0.2s",
                    overflow: "hidden",
                  }}
                >
                  {/* Collapsed Header Card */}
                  <div
                    onClick={() => toggleExpand(trainee.trainee_id)}
                    style={{
                      padding: "1.25rem 1.5rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      userSelect: "none",
                    }}
                  >
                    {/* Metadata */}
                    <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {trainee.trainee_full_name}
                      </h4>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "0.8125rem",
                          color: "var(--color-text-secondary)",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {trainee.trainee_email}
                      </p>
                    </div>

                    {/* Progress percentage circular meter representation */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Completion Stat */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "999px",
                            background: `conic-gradient(#2563eb ${trainee.overall_progress_percentage}%, #e5e7eb ${trainee.overall_progress_percentage}% 100%)`,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "999px",
                              background: "#fff",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {trainee.overall_progress_percentage}%
                          </div>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.6875rem", color: "#6b7280" }}>
                            Completion
                          </p>
                          <p style={{ margin: "1px 0 0", fontSize: "0.75rem", fontWeight: 600, color: "#111827" }}>
                            {trainee.overall_progress_percentage}%
                          </p>
                        </div>
                      </div>

                      {/* Score Avg Stat */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "999px",
                            background:
                              trainee.overall_score_avg == null
                                ? "#e5e7eb"
                                : `conic-gradient(#16a34a ${Math.round(trainee.overall_score_avg * 100)}%, #e5e7eb ${Math.round(trainee.overall_score_avg * 100)}% 100%)`,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "999px",
                              background: "#fff",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {formatScore(trainee.overall_score_avg)}
                          </div>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.6875rem", color: "#6b7280" }}>
                            Score avg
                          </p>
                          <p style={{ margin: "1px 0 0", fontSize: "0.75rem", fontWeight: 600, color: "#111827" }}>
                            {formatScore(trainee.overall_score_avg)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <div style={{ color: "var(--color-text-muted)" }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Body Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 1.5rem 1.5rem",
                        borderTop: "1px solid var(--color-border)",
                        background: "#fafbfd",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "1rem",
                          padding: "1.25rem 0",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
                            Completed Lessons Count
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "0.9375rem", fontWeight: 700, color: "#111827" }}>
                            {trainee.completed_nodes} / {progress.total_nodes} lessons
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
                            Last Activity Timestamp
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "0.9375rem", fontWeight: 700, color: "#111827" }}>
                            {formatDate(trainee.last_activity_at)}
                          </p>
                        </div>
                      </div>

                      {/* View detailed topic breakdown button */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          paddingTop: "1rem",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setDetailModalTrainee(trainee)}
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.8125rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                          }}
                        >
                          View in Detail
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Modal for Node-Level breakdown ── */}
      {detailModalTrainee && (
        <div
          className="learning-progress-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.4)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
          onClick={() => setDetailModalTrainee(null)}
        >
          <div
            className="learning-progress-modal__dialog"
            style={{
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
                  {detailModalTrainee.trainee_full_name}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  {detailModalTrainee.trainee_email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalTrainee(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "0.25rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              {/* Overall stats cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.75rem 1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.6875rem", color: "#64748b", fontWeight: 600 }}>COMPLETION</p>
                  <p style={{ margin: "2px 0 0", fontSize: "1.125rem", fontWeight: 800, color: "#0f172a" }}>
                    {detailModalTrainee.overall_progress_percentage}%
                  </p>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.75rem 1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.6875rem", color: "#64748b", fontWeight: 600 }}>SCORE AVERAGE</p>
                  <p style={{ margin: "2px 0 0", fontSize: "1.125rem", fontWeight: 800, color: "#0f172a" }}>
                    {formatScore(detailModalTrainee.overall_score_avg)}
                  </p>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.75rem 1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.6875rem", color: "#64748b", fontWeight: 600 }}>LAST ACTIVE</p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                    title={formatDate(detailModalTrainee.last_activity_at)}
                  >
                    {detailModalTrainee.last_activity_at
                      ? new Date(detailModalTrainee.last_activity_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Node-Level Table */}
              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                Topic-by-Topic Breakdown
              </h4>
              {detailModalTrainee.node_progress.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b", fontStyle: "italic", fontSize: "0.8125rem" }}>
                  Trainee has not interacted with any topics in this space yet.
                </div>
              ) : (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>
                        <th style={{ padding: "0.75rem 1rem" }}>Topic</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Completion</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Material Read</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Quiz Attempts</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Best Quiz Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModalTrainee.node_progress.map((node) => (
                        <tr
                          key={node.node_id}
                          onClick={() => {
                            if (onNavigateNode && node.is_active) {
                              onNavigateNode(node.node_id);
                              setDetailModalTrainee(null);
                            }
                          }}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            cursor: onNavigateNode && node.is_active ? "pointer" : "default",
                            background: node.is_active ? "#fff" : "#f1f5f9",
                            opacity: node.is_active ? 1 : 0.7,
                          }}
                        >
                          <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#0f172a" }}>
                            {node.node_title}
                            {!node.is_active && (
                              <span style={{ fontSize: "0.6875rem", color: "#ef4444", marginLeft: "0.5rem" }}>
                                (Deleted)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "6px",
                                fontWeight: 700,
                                fontSize: "0.6875rem",
                                background:
                                  node.completion_status === "completed"
                                    ? "rgba(16,185,129,0.1)"
                                    : node.completion_status === "in_progress"
                                    ? "rgba(245,158,11,0.1)"
                                    : "rgba(100,116,139,0.1)",
                                color:
                                  node.completion_status === "completed"
                                    ? "#10b981"
                                    : node.completion_status === "in_progress"
                                    ? "#d97706"
                                    : "#64748b",
                              }}
                            >
                              {node.completion_status.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>
                            {node.study_material_read_percent}%
                          </td>
                          <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>
                            {node.quiz_attempt_count}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", color: "#334155", fontWeight: 600 }}>
                            {formatScore(node.quiz_best_score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "flex-end",
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDetailModalTrainee(null)}
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.8125rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSpaceProgressPanel;
