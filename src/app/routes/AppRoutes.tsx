// src/app/routes/AppRoutes.tsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../../features/auth/components/LoginPage";
import AdminDashboard from "../../features/dashboard/components/AdminDashboard";
import DepartmentManagementPage from "../../features/department_creation/components/DepartmentManagementPage";
import AccountManagementPage from "../../features/account_creation/components/AccountManagementPage";
import ProtectedRoute from "./ProtectedRoute";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../features/auth/hooks/useAuth";

/** Layout wrapper for authenticated pages — renders sidebar + main content area */
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-surface)", overflowY: "auto" }}>
      {children}
    </main>
  </div>
);

const AppRoutes: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/auth"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* IT Admin protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="itadmin">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute requiredRole="itadmin">
            <AdminLayout>
              <DepartmentManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedRoute requiredRole="itadmin">
            <AdminLayout>
              <AccountManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
