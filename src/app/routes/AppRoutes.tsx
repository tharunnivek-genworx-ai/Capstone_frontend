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
  <div className="learning-experience" style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflowY: "auto" }}>
      {children}
    </main>
  </div>
);

/** Layout wrapper for trainee pages */
const TraineeLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="learning-experience" style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", background: "var(--color-bg-page)", overflowY: "auto" }}>
      {children}
    </main>
  </div>
);

const LEARNING_SIDEBAR_STORAGE_KEY = "studyguru.learning-sidebar-collapsed";
const COMPACT_LEARNING_SHELL_QUERY = "(max-width: 768px)";

interface LearningSpaceRouteLayoutProps {
  children: React.ReactNode;
  background?: string;
  overflow?: React.CSSProperties["overflow"];
}

/** Persistent learning navigation used by space detail and trainee quiz routes. */
const LearningSpaceRouteLayout: React.FC<LearningSpaceRouteLayoutProps> = ({
  children,
  background = "var(--color-bg-page)",
  overflow = "hidden",
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    try {
      return window.localStorage.getItem(LEARNING_SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [isCompactViewport, setIsCompactViewport] = React.useState(
    () => window.matchMedia(COMPACT_LEARNING_SHELL_QUERY).matches,
  );
  const [isCompactDrawerOpen, setIsCompactDrawerOpen] = React.useState(false);
  const drawerToggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_LEARNING_SHELL_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactViewport(event.matches);
      setIsCompactDrawerOpen(false);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  React.useEffect(() => {
    if (!isCompactViewport || !isCompactDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const drawerToggle = drawerToggleRef.current;
    document.body.style.overflow = "hidden";
    document
      .querySelector<HTMLElement>("#learning-spaces-sidebar .learning-spaces-sidebar__drawer-close")
      ?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsCompactDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      drawerToggle?.focus();
    };
  }, [isCompactDrawerOpen, isCompactViewport]);

  const handleSidebarCollapsedChange = (isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
    try {
      window.localStorage.setItem(LEARNING_SIDEBAR_STORAGE_KEY, String(isCollapsed));
    } catch {
      // The shell still works when storage is unavailable.
    }
  };

  return (
    <div
      className={`learning-experience learning-space-route-layout${
        isSidebarCollapsed ? " learning-space-route-layout--sidebar-collapsed" : ""
      }${isCompactViewport ? " learning-space-route-layout--compact" : ""}${
        isCompactDrawerOpen ? " learning-space-route-layout--drawer-open" : ""
      }`}
    >
      {isCompactViewport && (
        <>
          <button
            ref={drawerToggleRef}
            type="button"
            className="learning-space-route-layout__drawer-toggle"
            onClick={() => setIsCompactDrawerOpen(true)}
            aria-label="Open learning spaces navigation"
            aria-expanded={isCompactDrawerOpen}
            aria-controls="learning-spaces-sidebar"
          >
            <i className="ti ti-menu-2" aria-hidden="true" />
          </button>
          {isCompactDrawerOpen && (
            <button
              type="button"
              className="learning-space-route-layout__drawer-backdrop"
              onClick={() => setIsCompactDrawerOpen(false)}
              aria-label="Close learning spaces navigation"
            />
          )}
        </>
      )}
      <LearningSpacesSidebar
        isCollapsed={isSidebarCollapsed}
        isCompact={isCompactViewport}
        isDrawerOpen={isCompactDrawerOpen}
        onRequestClose={() => setIsCompactDrawerOpen(false)}
        onCollapsedChange={handleSidebarCollapsedChange}
      />
      <div
        className="learning-space-route-layout__content"
        style={{ background, overflow }}
      >
        {children}
      </div>
    </div>
  );
};

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
            <LearningSpaceRouteLayout>
              <SpaceDetailPage />
            </LearningSpaceRouteLayout>
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
            <LearningSpaceRouteLayout>
              <SpaceDetailPage />
            </LearningSpaceRouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/quiz/attempt/:attemptId"
        element={
          <ProtectedRoute requiredRole="trainee">
            <LearningSpaceRouteLayout background="#f5f5f7">
              <QuizAttemptPage />
            </LearningSpaceRouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/nodes/:nodeId/quiz/:quizId/attempts"
        element={
          <ProtectedRoute requiredRole="trainee">
            <LearningSpaceRouteLayout background="#f5f5f7" overflow="auto">
              <QuizAttemptHistoryPage />
            </LearningSpaceRouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/nodes/:nodeId/quiz/:quizId/archive-review"
        element={
          <ProtectedRoute requiredRole="trainee">
            <LearningSpaceRouteLayout background="#f5f5f7" overflow="auto">
              <ArchivedQuizReviewPage />
            </LearningSpaceRouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/spaces/:spaceId/quiz/attempt/:attemptId/results"
        element={
          <ProtectedRoute requiredRole="trainee">
            <LearningSpaceRouteLayout background="#f5f5f7" overflow="auto">
              <QuizAttemptResultsPage />
            </LearningSpaceRouteLayout>
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
