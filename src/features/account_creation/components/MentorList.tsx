// src/features/account_creation/components/MentorList.tsx
import React from "react";
import toast from "react-hot-toast";
import { useMentors } from "../hooks/useMentors";
import type { MentorOut } from "../types/account.types";

interface MentorListProps {
  refreshTrigger?: number;
  onViewProfile: (mentor: MentorOut) => void;
}

const MentorList: React.FC<MentorListProps> = ({ refreshTrigger, onViewProfile }) => {
  const { data, isLoading, error, page, goToNextPage, goToPrevPage, refetch, deactivateMentor, reactivateMentor } = useMentors(10);

  React.useEffect(() => {
    if (refreshTrigger) refetch();
  }, [refreshTrigger, refetch]);

  const handleDeactivate = async (mentor: MentorOut) => {
    const result = await deactivateMentor(mentor.mentorid);
    if (result) toast.success(`${mentor.fullname} deactivated.`);
    else toast.error("Failed to deactivate.");
  };

  const handleReactivate = async (mentor: MentorOut) => {
    const result = await reactivateMentor(mentor.mentorid);
    if (result) toast.success(`${mentor.fullname} reactivated.`);
    else toast.error("Failed to reactivate.");
  };

  if (isLoading && !data) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <span className="spinner" style={{ borderTopColor: "var(--color-primary)", width: "2rem", height: "2rem" }} />
    </div>
  );

  if (error) return <div style={{ color: "var(--color-danger)", padding: "1.5rem", textAlign: "center", fontSize: "0.875rem" }}>{error}</div>;

  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
          <p>No mentors yet. Create your first mentor above.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Name", "Email", "Designation", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.875rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.mentorid} style={{ borderBottom: "1px solid rgba(51,65,85,0.5)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,99,235,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <button onClick={() => onViewProfile(m)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", color: "#fff", flexShrink: 0 }}>
                          {m.fullname.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{m.fullname}</span>
                      </div>
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{m.email}</td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{m.designation}</td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span className={m.isactive ? "badge-active" : "badge-inactive"}>{m.isactive ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-secondary" style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }} onClick={() => onViewProfile(m)}>View</button>
                      {m.isactive
                        ? <button className="btn-danger" style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }} onClick={() => handleDeactivate(m)}>Deactivate</button>
                        : <button className="btn-success" style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }} onClick={() => handleReactivate(m)}>Reactivate</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Page {page} of {totalPages} · {data?.total} mentors</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }} disabled={page <= 1} onClick={goToPrevPage}>← Prev</button>
            <button className="btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }} disabled={page >= totalPages} onClick={() => goToNextPage(totalPages)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorList;
