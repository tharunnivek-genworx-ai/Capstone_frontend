// src/components/layout/Sidebar.tsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import toast from "react-hot-toast";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: "nav-departments",
    label: "Departments",
    path: "/admin/departments",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
  {
    id: "nav-accounts",
    label: "Accounts",
    path: "/admin/accounts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
];

const mentorNavItems: NavItem[] = [
  {
    id: "nav-mentor-spaces",
    label: "My Learning Spaces",
    path: "/mentor/spaces",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

const Sidebar: React.FC = () => {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems =
    role === "mentor"
      ? mentorNavItems
      : role === "itadmin"
      ? adminNavItems
      : [];

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
      {/* Logo */}
      <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)", lineHeight: 1.2 }}>StudyGuru</p>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {role === "mentor" ? "Instructor" : role === "itadmin" ? "Admin" : role === "trainee" ? "Learner" : "Admin"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            id={item.id}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              color: isActive ? "#fff" : "var(--color-text-secondary)",
              background: isActive ? "var(--color-primary)" : "transparent",
              boxShadow: isActive ? "var(--shadow-subtle)" : "none",
              transition: "background 0.2s, color 0.2s",
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
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
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {loggingOut ? (
            <span className="spinner" style={{ borderTopColor: "var(--color-danger)", flexShrink: 0 }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          )}
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
