// src/features/department_creation/components/DepartmentManagementPage.tsx
import React, { useState } from "react";
import CreateDepartmentForm from "./CreateDepartmentForm";
import DepartmentList from "./DepartmentList";

const DepartmentManagementPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setRefreshTrigger((v) => v + 1);
    setShowForm(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
            Departments
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage organisational departments. Create departments before adding mentors or trainees.
          </p>
        </div>
        <button
          id="toggle-create-dept"
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Cancel
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Department
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: "1.75rem", border: "1px solid rgba(37,99,235,0.3)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-text-primary)" }}>
            Create New Department
          </h2>
          <CreateDepartmentForm onSuccess={handleSuccess} />
        </div>
      )}

      {/* List */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "var(--color-text-primary)" }}>
            All Departments
          </h2>
        </div>
        <DepartmentList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default DepartmentManagementPage;
