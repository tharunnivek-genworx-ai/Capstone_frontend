import React from "react";

interface CircularProgressStatProps {
  label: string;
  percentage: number;
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
  const pct = Math.max(0, Math.min(100, percentage));
  const track = "#e5e7eb";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: "999px",
          background: `conic-gradient(${color} ${pct}%, ${track} ${pct}% 100%)`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: size - 12,
            height: size - 12,
            borderRadius: "999px",
            background: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {valueLabel}
        </div>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", fontWeight: 600, color: "#111827" }}>
          {pct}%
        </p>
      </div>
    </div>
  );
};

export default CircularProgressStat;

