// src/features/auth/components/LoginPage.tsx
/**
 * Login page — email + password form for all roles.
 * After login, navigation is handled by the router based on role.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      // Role-based redirect: mentors go to their spaces, admins to dashboard
      const storedRole = localStorage.getItem("user_role");
      if (storedRole === "mentor") {
        navigate("/mentor/spaces", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      // error already set in context
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 60% 20%, rgba(37,99,235,0.18) 0%, transparent 60%), var(--color-surface)",
        padding: "1.5rem",
      }}
    >
      <div className="animate-fade-in" style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              marginBottom: "1rem",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            StudyGuru
          </h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
              marginTop: "0.375rem",
            }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            border: "1px solid rgba(37,99,235,0.25)",
            boxShadow: "0 4px 40px rgba(0,0,0,0.4), var(--shadow-glow)",
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="login-email" className="label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="login-password" className="label">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  marginBottom: "1.25rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-danger)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="btn-primary"
              style={{ width: "100%", padding: "0.75rem" }}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
          }}
        >
          Credentials are managed by your IT Administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
