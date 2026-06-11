// src/components/layout/LearningSpacesSidebar.tsx
/**
 * Sidebar for space detail (and mentor space) views.
 * Lists the user's learning spaces for quick navigation.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useSpaces } from "../../features/spaces/hooks/useSpaces";
import toast from "react-hot-toast";

interface LearningSpacesSidebarProps {
  activeSpaceId?: string;
}

const LearningSpacesSidebar: React.FC<LearningSpacesSidebarProps> = ({ activeSpaceId }) => {
  const { spaceId: routeSpaceId } = useParams<{ spaceId: string }>();
  const currentSpaceId = activeSpaceId ?? routeSpaceId;
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const { spaces, isLoading, fetchSpaces } = useSpaces();
  const [loggingOut, setLoggingOut] = useState(false);

  const basePath = role === "trainee" ? "/trainee/spaces" : "/mentor/spaces";

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--color-bg-surface)",
        boxShadow: "var(--shadow-subtle)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 20,
      }}
    >
      <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)", lineHeight: 1.2 }}>StudyGuru</p>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {role === "mentor" ? "Instructor" : role === "trainee" ? "Learner" : "Admin"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "1rem 0.75rem 0.5rem" }}>
        <p style={{ margin: "0 0 0.625rem", padding: "0 0.125rem", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          My learning spaces
        </p>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "0 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 0" }}>
            <span className="spinner" style={{ width: "1.25rem", height: "1.25rem" }} />
          </div>
        )}
        {!isLoading && spaces.length === 0 && (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", padding: "0.5rem 0.25rem", margin: 0, lineHeight: 1.5 }}>
            No learning spaces yet.
          </p>
        )}
        {spaces.map((space) => {
          const isActive = space.space_id === currentSpaceId;
          return (
            <button
              key={space.space_id}
              type="button"
              onClick={() => navigate(`${basePath}/${space.space_id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                width: "100%",
                padding: "0.625rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${isActive ? "var(--color-primary)" : "transparent"}`,
                background: isActive ? "var(--color-primary-subtle)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--color-bg-surface-alt)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: isActive ? "var(--color-primary)" : "var(--color-bg-surface-alt)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#fff" : "var(--color-primary)"} strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--color-primary)" : "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={space.space_name}
              >
                {space.space_name}
              </span>
              {space.is_published && (
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-success)", flexShrink: 0 }} title="Published" />
              )}
            </button>
          );
        })}
      </nav>

      {role === "mentor" && (
        <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid var(--color-border)" }}>
          <button
            type="button"
            onClick={() => navigate("/mentor/spaces")}
            className="btn-secondary"
            style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem" }}
          >
            All learning spaces
          </button>
        </div>
      )}

      <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid var(--color-border)" }}>
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.625rem 0.875rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            color: "var(--color-danger)",
            background: "transparent",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-danger-subtle)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {loggingOut ? (
            <span className="spinner" style={{ borderTopColor: "var(--color-danger)", flexShrink: 0 }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
};

export default LearningSpacesSidebar;
