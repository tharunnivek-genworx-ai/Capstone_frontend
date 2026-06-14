// src/features/dashboard/components/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountService } from "../../account_creation/services/accountService";
import { dashboardService } from "../services/dashboardService";
import ProfileCard from "../../../components/ui/ProfileCard";
import type { MentorOut, TraineeOut } from "../../account_creation/types/account.types";

type ProfileData =
  | ({ type: "mentor" } & MentorOut)
  | ({ type: "trainee" } & TraineeOut);

interface DashboardStats {
  totalMentors: number;
  totalTrainees: number;
  totalDepartments: number;
  activeMentors: number;
  activeTrainees: number;
}

const StatCard: React.FC<{ label: string; value: number; sub?: string; icon: React.ReactNode; accent?: string }> = ({
  label, value, sub, icon, accent = "var(--color-primary)"
}) => (
  <div className="card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 0.25rem", fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "var(--color-text-primary)", lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>{sub}</p>}
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMentors, setRecentMentors] = useState<MentorOut[]>([]);
  const [recentTrainees, setRecentTrainees] = useState<TraineeOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [mentorRes, traineeRes, stats] = await Promise.all([
          accountService.listMentors(1, 5),
          accountService.listTrainees(1, 5),
          dashboardService.getStats(),
        ]);
        setStats({
          totalMentors: stats.total_mentors,
          totalTrainees: stats.total_trainees,
          totalDepartments: stats.total_departments,
          activeMentors: stats.active_mentors,
          activeTrainees: stats.active_trainees,
        });
        setRecentMentors(mentorRes.items);
        setRecentTrainees(traineeRes.items);
      } catch {
        // graceful degradation
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--color-text-primary)" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
          Overview of your organisation's accounts and departments.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <span className="spinner" style={{ borderTopColor: "var(--color-primary)", width: "2.5rem", height: "2.5rem" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          <StatCard label="Total Departments" value={stats?.totalDepartments ?? 0} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          } />
          <StatCard label="Total Mentors" value={stats?.totalMentors ?? 0} sub={`${stats?.activeMentors ?? 0} active`} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          } accent="#8b5cf6" />
          <StatCard label="Total Trainees" value={stats?.totalTrainees ?? 0} sub={`${stats?.activeTrainees ?? 0} active`} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          } accent="#0ea5e9" />
        </div>
      )}

      {/* Recent tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Mentors */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>Recent Mentors</h2>
            <button onClick={() => navigate("/admin/accounts", { state: { defaultTab: "mentors" } })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-primary)", fontWeight: 500 }}>
              View all →
            </button>
          </div>
          {recentMentors.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>No mentors yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {recentMentors.map((m) => (
                <button key={m.mentorid} onClick={() => setSelectedProfile({ type: "mentor", ...m })}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0.625rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left", transition: "background 0.15s", width: "100%" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,99,235,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "0.875rem", flexShrink: 0 }}>
                    {m.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.fullname}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.designation}</p>
                  </div>
                  <span className={m.isactive ? "badge-active" : "badge-inactive"} style={{ flexShrink: 0 }}>{m.isactive ? "Active" : "Inactive"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trainees */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>Recent Trainees</h2>
            <button onClick={() => navigate("/admin/accounts", { state: { defaultTab: "trainees" } })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-primary)", fontWeight: 500 }}>
              View all →
            </button>
          </div>
          {recentTrainees.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>No trainees yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {recentTrainees.map((t) => (
                <button key={t.traineeid} onClick={() => setSelectedProfile({ type: "trainee", ...t })}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0.625rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left", transition: "background 0.15s", width: "100%" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(14,165,233,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "0.875rem", flexShrink: 0 }}>
                    {t.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.fullname}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{t.joiningdate ? `Joined ${new Date(t.joiningdate).toLocaleDateString()}` : t.email}</p>
                  </div>
                  <span className={t.isactive ? "badge-active" : "badge-inactive"} style={{ flexShrink: 0 }}>{t.isactive ? "Active" : "Inactive"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile slide-over */}
      <ProfileCard data={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
};

export default AdminDashboard;
