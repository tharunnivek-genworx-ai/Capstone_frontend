import React from "react";
import "../styles/learningProgress.css";

interface CircularProgressStatProps {
  label: string;
  percentage: number | null;
  valueLabel: string;
  color?: string;
  size?: number;
}

const CircularProgressStat: React.FC<CircularProgressStatProps> = ({
  label,
  percentage,
  valueLabel,
  color = "#2563eb",
  size = 74,
}) => {
  const pct = percentage == null ? null : Math.max(0, Math.min(100, percentage));
  const track = "var(--as-surface-container, #e5e7eb)";

  return (
    <div className="learning-progress-stat">
      <div
        className="learning-progress-stat__ring"
        aria-hidden
        style={{
          width: size,
          height: size,
          background:
            pct == null
              ? track
              : `conic-gradient(${color} ${pct}%, ${track} ${pct}% 100%)`,
        }}
      >
        <div
          className="learning-progress-stat__value"
          style={{
            width: size - 12,
            height: size - 12,
          }}
        >
          {valueLabel}
        </div>
      </div>
      <div>
        <p className="learning-progress-stat__label">{label}</p>
        <p className="learning-progress-stat__percent">{valueLabel}</p>
      </div>
    </div>
  );
};

export default CircularProgressStat;

