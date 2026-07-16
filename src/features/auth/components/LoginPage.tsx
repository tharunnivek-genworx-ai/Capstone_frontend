// src/features/auth/components/LoginPage.tsx
/**
 * Login page — email + password form for all roles.
 * After login, navigation is handled by the router based on role.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./loginPage.css";

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
      const storedRole = localStorage.getItem("user_role");
      if (storedRole === "mentor") {
        navigate("/mentor/spaces", { replace: true });
      } else if (storedRole === "trainee") {
        navigate("/trainee/spaces", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      // error already set in context
    }
  };

  return (
    <div className="learning-experience sg-login">
      <div className="sg-login__shell animate-fade-in">
        <div className="sg-login__brand">
          <div className="sg-login__logo" aria-hidden="true">
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
          <h1 className="sg-login__title">StudyGuru</h1>
          <p className="sg-login__subtitle">Sign in to your account</p>
        </div>

        <div className="sg-login__card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="sg-login__field">
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

            <div className="sg-login__field sg-login__field--password">
              <label htmlFor="login-password" className="label">
                Password
              </label>
              <div className="sg-login__password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="sg-login__password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
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

            {error && (
              <div className="sg-login__error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn-primary sg-login__submit"
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

        <p className="sg-login__footnote">
          Credentials are managed by your IT Administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
