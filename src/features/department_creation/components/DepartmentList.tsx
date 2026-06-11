// src/features/department_creation/components/DepartmentList.tsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDepartments } from "../hooks/useDepartments";
import type { DepartmentOut } from "../types/department.types";

interface DepartmentListProps {
  refreshTrigger?: number;
}

const DepartmentList: React.FC<DepartmentListProps> = ({ refreshTrigger }) => {
  const { data, isLoading, error, page, goToNextPage, goToPrevPage, refetch, updateDepartment } =
    useDepartments(10);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Trigger external refetch when parent creates a new dept
  React.useEffect(() => {
    if (refreshTrigger) refetch();
  }, [refreshTrigger, refetch]);

  const startEdit = (dept: DepartmentOut) => {
    setEditingId(dept.departmentid);
    setEditName(dept.departmentname);
    setEditDesc(dept.description ?? "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (dept: DepartmentOut) => {
    const result = await updateDepartment(dept.departmentid, {
      departmentname: editName.trim(),
      description: editDesc.trim() || null,
    });
    if (result) {
      toast.success("Department updated.");
      setEditingId(null);
    } else {
      toast.error("Failed to update department.");
    }
  };

  const toggleActive = async (dept: DepartmentOut) => {
    const result = await updateDepartment(dept.departmentid, {
      isactive: !dept.isactive,
    });
    if (result) {
      toast.success(`Department ${result.isactive ? "activated" : "deactivated"}.`);
    } else {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <span className="spinner" style={{ borderTopColor: "var(--color-primary)", width: "2rem", height: "2rem" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--color-danger)", padding: "1.5rem", textAlign: "center", fontSize: "0.875rem" }}>
        {error}
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
          <p style={{ fontSize: "0.9375rem" }}>No departments yet.</p>
          <p style={{ fontSize: "0.8125rem", marginTop: "0.5rem" }}>Create your first department above.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["ID", "Name", "Code", "Description", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.875rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((dept) => (
                <tr
                  key={dept.departmentid}
                  style={{ borderBottom: "1px solid rgba(51,65,85,0.5)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,99,235,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      {dept.departmentid}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.875rem", fontWeight: 500 }}>
                    {editingId === dept.departmentid ? (
                      <input
                        className="input-field"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem" }}
                      />
                    ) : (
                      dept.departmentname
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", background: "var(--color-surface-3)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "var(--color-primary)" }}>
                      {dept.departmentcode}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", maxWidth: "220px" }}>
                    {editingId === dept.departmentid ? (
                      <input
                        className="input-field"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description…"
                        style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem" }}
                      />
                    ) : (
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {dept.description || "—"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span className={dept.isactive ? "badge-active" : "badge-inactive"}>
                      {dept.isactive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {editingId === dept.departmentid ? (
                        <>
                          <button className="btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => saveEdit(dept)}>Save</button>
                          <button className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => startEdit(dept)}>Edit</button>
                          <button
                            className={dept.isactive ? "btn-danger" : "btn-success"}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                            onClick={() => toggleActive(dept)}
                          >
                            {dept.isactive ? "Deactivate" : "Activate"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Page {page} of {totalPages} · {data?.total} departments
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }} disabled={page <= 1} onClick={goToPrevPage}>← Prev</button>
            <button className="btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }} disabled={page >= totalPages} onClick={() => goToNextPage(totalPages)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
