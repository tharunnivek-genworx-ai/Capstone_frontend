// src/app/routes/AppRoutes.tsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../../features/auth/components/LoginPage";
import AdminDashboard from "../../features/dashboard/components/AdminDashboard";
import DepartmentManagementPage from "../../features/department_creation/components/DepartmentManagementPage";
import AccountManagementPage from "../../features/account_creation/components/AccountManagementPage";
import SpacesListPage from "../../features/spaces/components/SpacesListPage";
import SpaceDetailPage from "../../features/spaces/components/SpaceDetailPage";
import QuizAttemptPage from "../../features/trainee_quiz/components/QuizAttemptPage";
import QuizAttemptResultsPage from "../../features/trainee_quiz/components/QuizAttemptResultsPage";
import QuizAttemptHistoryPage from "../../features/trainee_quiz/components/QuizAttemptHistoryPage";
import ArchivedQuizReviewPage from "../../features/trainee_quiz/components/ArchivedQuizReviewPage";
import ProtectedRoute from "./ProtectedRoute";
import Sidebar from "../../components/layout/Sidebar";
import LearningSpacesSidebar from "../../components/layout/LearningSpacesSidebar";
import { useAuth } from "../../features/auth/hooks/useAuth";

/** Layout wrapper for authenticated pages — renders sidebar + main content area */
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflowY: "auto" }}>
      {children}
    </main>
  </div>
);

/** Layout wrapper for mentor pages */
const MentorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflowY: "auto" }}>
      {children}
    </main>
  </div>
);

/** Layout wrapper for trainee pages */
const TraineeLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflowY: "auto" }}>
      {children}
    </main>
  </div>
);

const AppRoutes: React.FC = () => {
  const { isLoggedIn, role } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/auth"
        element={
          isLoggedIn
            ? <Navigate to={role === "mentor" ? "/mentor/spaces" : role === "trainee" ? "/trainee/spaces" : "/dashboard"} replace />
            : <LoginPage />
        }
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

      {/* Mentor protected routes */}
      <Route
        path="/mentor/spaces"
        element={
          <ProtectedRoute requiredRole="mentor">
            <MentorLayout>
              <SpacesListPage />
            </MentorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/spaces/:spaceId"
        element={
          <ProtectedRoute requiredRole="mentor">
            {/* SpaceDetailPage manages its own full layout (no sidebar margin) */}
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <LearningSpacesSidebar />
              <div style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <SpaceDetailPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Trainee protected routes */}
      <Route
        path="/trainee/spaces"
        element={
          <ProtectedRoute requiredRole="trainee">
            <TraineeLayout>
              <SpacesListPage />
            </TraineeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId"
        element={
          <ProtectedRoute requiredRole="trainee">
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <LearningSpacesSidebar />
              <div style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <SpaceDetailPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/quiz/attempt/:attemptId"
        element={
          <ProtectedRoute requiredRole="trainee">
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <LearningSpacesSidebar />
              <div style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "#f5f5f7", overflow: "hidden" }}>
                <QuizAttemptPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/nodes/:nodeId/quiz/:quizId/attempts"
        element={
          <ProtectedRoute requiredRole="trainee">
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <LearningSpacesSidebar />
              <div style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "#f5f5f7", overflow: "auto" }}>
                <QuizAttemptHistoryPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/nodes/:nodeId/quiz/:quizId/archive-review"
        element={
          <ProtectedRoute requiredRole="trainee">
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <LearningSpacesSidebar />
              <div style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "#f5f5f7", overflow: "auto" }}>
                <ArchivedQuizReviewPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/quiz/attempt/:attemptId/results"
        element={
          <ProtectedRoute requiredRole="trainee">
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <LearningSpacesSidebar />
              <div style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "#f5f5f7", overflow: "auto" }}>
                <QuizAttemptResultsPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? (role === "mentor" ? "/mentor/spaces" : role === "trainee" ? "/trainee/spaces" : "/dashboard") : "/auth"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
