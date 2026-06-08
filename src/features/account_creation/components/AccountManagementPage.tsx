// src/features/account_creation/components/AccountManagementPage.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import MentorList from "./MentorList";
import TraineeList from "./TraineeList";
import CreateMentorForm from "./CreateMentorForm";
import CreateTraineeForm from "./CreateTraineeForm";
import ProfileCard from "../../../components/ui/ProfileCard";
import type { MentorOut, TraineeOut } from "../types/account.types";

type ActiveTab = "mentors" | "trainees";
type ProfileData =
  | ({ type: "mentor" } & MentorOut)
  | ({ type: "trainee" } & TraineeOut);

const AccountManagementPage: React.FC = () => {
  const location = useLocation();
  const initialTab = (location.state as { defaultTab?: ActiveTab } | null)?.defaultTab || "mentors";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

  const handleSuccess = () => {
    setRefreshTrigger((v) => v + 1);
    setShowForm(false);
  };

  const handleViewMentor = (mentor: MentorOut) =>
    setSelectedProfile({ type: "mentor", ...mentor });

  const handleViewTrainee = (trainee: TraineeOut) =>
    setSelectedProfile({ type: "trainee", ...trainee });

  const tabStyle = (tab: ActiveTab) => ({
    padding: "0.5rem 1.25rem",
    fontWeight: 600,
    fontSize: "0.875rem",
    border: "none",
    cursor: "pointer",
    borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
    background: "none",
    color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-muted)",
    transition: "color 0.2s, border-color 0.2s",
  });

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
            Account Management
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Create and manage mentor and trainee accounts.
          </p>
        </div>
        <button
          id="toggle-create-account"
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Cancel</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New {activeTab === "mentors" ? "Mentor" : "Trainee"}</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
        <button id="tab-mentors" style={tabStyle("mentors")} onClick={() => { setActiveTab("mentors"); setShowForm(false); }}>
          Mentors
        </button>
        <button id="tab-trainees" style={tabStyle("trainees")} onClick={() => { setActiveTab("trainees"); setShowForm(false); }}>
          Trainees
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: "1.75rem", border: "1px solid rgba(37,99,235,0.3)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-text-primary)" }}>
            Create New {activeTab === "mentors" ? "Mentor" : "Trainee"}
          </h2>
          {activeTab === "mentors"
            ? <CreateMentorForm onSuccess={handleSuccess} />
            : <CreateTraineeForm onSuccess={handleSuccess} />
          }
        </div>
      )}

      {/* List */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "var(--color-text-primary)" }}>
            {activeTab === "mentors" ? "All Mentors" : "All Trainees"}
          </h2>
        </div>
        {activeTab === "mentors"
          ? <MentorList refreshTrigger={refreshTrigger} onViewProfile={handleViewMentor} />
          : <TraineeList refreshTrigger={refreshTrigger} onViewProfile={handleViewTrainee} />
        }
      </div>

      {/* Profile slide-over */}
      <ProfileCard data={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
};

export default AccountManagementPage;
