import React, { useState } from "react";
import type { TraineeOwnSpaceProgressOut } from "../types/traineeSpaceProgress.types";
import CircularProgressStat from "./CircularProgressStat";

interface SpaceProgressPanelProps {
  progress: TraineeOwnSpaceProgressOut;
  onNavigateNode: (nodeId: string) => void;
}

const SpaceProgressPanel: React.FC<SpaceProgressPanelProps> = ({ progress, onNavigateNode }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", height: "100%" }}>
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "1rem",
          background: "#fff",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: "0 0 0.875rem", fontSize: "1rem", color: "#111827" }}>E-space progress</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
          <CircularProgressStat
            label="Overall completion"
            percentage={progress.overall_progress_percentage}
            valueLabel={`${progress.overall_progress_percentage}%`}
            color="#2563eb"
          />
          <CircularProgressStat
            label="Quiz score average"
            percentage={progress.overall_score_percentage ?? 0}
            valueLabel={
              progress.overall_score_percentage == null ? "N/A" : `${progress.overall_score_percentage}%`
            }
            color="#16a34a"
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#374151" }}>
            <strong>Total topics:</strong> {progress.total_nodes}
          </p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#374151" }}>
            <strong>Completed topics:</strong> {progress.completed_nodes}
          </p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#374151" }}>
            <strong>Overall score avg:</strong>{" "}
            {progress.overall_score_avg == null ? "N/A" : progress.overall_score_avg.toFixed(2)}
          </p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#374151" }}>
            <strong>Last activity:</strong>{" "}
            {progress.last_activity_at ? new Date(progress.last_activity_at).toLocaleString() : "No activity yet"}
          </p>
        </div>
      </div>

      <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            width: "100%",
            background: "#f8fafc",
            border: "none",
            borderBottom: expanded ? "1px solid var(--color-border)" : "none",
            padding: "0.875rem 1rem",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>Per topic breakdown</span>
          <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{expanded ? "Hide" : "Show"}</span>
        </button>
        {expanded && (
          <div style={{ maxHeight: "420px", overflowY: "auto", padding: "0.5rem" }}>
            {progress.node_progress.map((node) => (
              <button
                key={node.node_id}
                type="button"
                onClick={() => onNavigateNode(node.node_id)}
                style={{
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#fff",
                  padding: "0.625rem 0.75rem",
                  marginBottom: "0.5rem",
                  textAlign: "left",
                  cursor: "pointer",
                  paddingLeft: `${Math.max(0, node.node_level - 1) * 16 + 12}px`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#111827" }}>{node.node_title}</span>
                  <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                    {node.progress_percentage}%
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                  {node.completion_status.replace("_", " ")} · Read {node.study_material_read_percent}% · Quiz attempts{" "}
                  {node.quiz_attempt_count}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceProgressPanel;

