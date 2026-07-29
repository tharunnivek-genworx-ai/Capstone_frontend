// src/app/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import type { UserRole } from "../../features/auth/types/auth.types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: restrict to a specific role. If provided and role doesn't match, redirects to /auth. */
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isLoggedIn, role, isBootstrapping } = useAuth();

  // Wait for silent refresh on reload before deciding auth state
  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Role mismatch — signed in but wrong role
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
