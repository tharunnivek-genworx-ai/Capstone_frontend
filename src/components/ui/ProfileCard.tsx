// src/components/ui/ProfileCard.tsx
/**
 * Slide-over panel that shows a mentor or trainee's profile details.
 * Renders from the right side with an overlay backdrop.
 */

import React from "react";
import type { MentorOut } from "../../features/account_creation/types/account.types";
import type { TraineeOut } from "../../features/account_creation/types/account.types";

type ProfileData =
  | ({ type: "mentor" } & MentorOut)
  | ({ type: "trainee" } & TraineeOut);

interface ProfileCardProps {
  data: ProfileData | null;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
  <div style={{ padding: "0.75rem 0", borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.2rem" }}>{label}</p>
    <p style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", margin: 0, wordBreak: "break-all" }}>
      {value || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
    </p>
  </div>
);

const ProfileCard: React.FC<ProfileCardProps> = ({ data, onClose }) => {
  if (!data) return null;

  const isMentor = data.type === "mentor";
  const mentor = isMentor ? (data as { type: "mentor" } & MentorOut) : null;
  const trainee = !isMentor ? (data as { type: "trainee" } & TraineeOut) : null;

  const name = isMentor ? mentor!.fullname : trainee!.fullname;
  const email = isMentor ? mentor!.email : trainee!.email;
  const isActive = isMentor ? mentor!.isactive : trainee!.isactive;
  const id = isMentor ? mentor!.mentorid : trainee!.traineeid;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 40,
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Slide-over panel */}
      <div
        className="animate-slide-right"
        style={{
          position: "fixed",
          top: "1.5rem", right: "1.5rem", bottom: "1.5rem",
          width: "min(440px, 95vw)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "-8px 8px 40px rgba(0,0,0,0.5)",
          zIndex: 50,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--color-surface)",
          borderTopLeftRadius: "calc(var(--radius-xl) - 1px)",
          borderTopRightRadius: "calc(var(--radius-xl) - 1px)",
        }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isMentor ? "Mentor Profile" : "Trainee Profile"}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.25rem" }}
            aria-label="Close panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ padding: "2rem 1.5rem 1.5rem", textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: isMentor
              ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
              : "linear-gradient(135deg, #0ea5e9, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1.75rem", color: "#fff",
            margin: "0 auto 1rem",
            boxShadow: "var(--shadow-glow)",
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--color-text-primary)" }}>{name}</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 0.75rem" }}>{email}</p>
          <span className={isActive ? "badge-active" : "badge-inactive"}>
            {isActive ? "Active" : "Inactive"}
          </span>
          {isMentor && mentor?.designation && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>{mentor.designation}</p>
          )}
        </div>

        {/* Details */}
        <div style={{ padding: "0 1.5rem 1.5rem", flex: 1 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: "1rem", paddingBottom: "0.25rem" }}>
            Account Details
          </p>

          <DetailRow label="ID" value={id} />
          <DetailRow label="Email" value={email} />

          {isMentor && mentor && (
            <>
              <DetailRow label="Full Name" value={mentor.fullname} />
              <DetailRow label="Designation" value={mentor.designation} />
              <DetailRow label="Employee ID" value={mentor.employeeid} />
              <DetailRow label="Phone" value={mentor.phone} />
              <DetailRow label="Department ID" value={mentor.departmentid} />
              <DetailRow label="Department Name" value={mentor.department_name} />
              <DetailRow label="Department Code" value={mentor.department_code} />
            </>
          )}

          {!isMentor && trainee && (
            <>
              <DetailRow label="Full Name" value={trainee.fullname} />
              <DetailRow label="Employee ID" value={trainee.employeeid} />
              <DetailRow label="Date of Birth" value={trainee.dob ? new Date(trainee.dob).toLocaleDateString() : null} />
              <DetailRow label="Phone" value={trainee.phone} />
              <DetailRow label="Joining Date" value={trainee.joiningdate ? new Date(trainee.joiningdate).toLocaleDateString() : null} />
              <DetailRow label="Department ID" value={trainee.departmentid} />
            </>
          )}

          <DetailRow label="Created At" value={isMentor ? mentor?.createdat ? new Date(mentor.createdat).toLocaleString() : null : trainee?.createdat ? new Date(trainee.createdat).toLocaleString() : null} />
          <DetailRow label="Last Updated" value={isMentor ? mentor?.updatedat ? new Date(mentor.updatedat).toLocaleString() : null : trainee?.updatedat ? new Date(trainee.updatedat).toLocaleString() : null} />

          {((isMentor && mentor?.deletedat) || (!isMentor && trainee?.deletedat)) && (
            <DetailRow
              label="Deactivated At"
              value={isMentor ? mentor?.deletedat ? new Date(mentor.deletedat).toLocaleString() : null : trainee?.deletedat ? new Date(trainee.deletedat).toLocaleString() : null}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileCard;
