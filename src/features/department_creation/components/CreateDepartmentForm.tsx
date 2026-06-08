// src/features/department_creation/components/CreateDepartmentForm.tsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useCreateDepartment } from "../hooks/useCreateDepartment";

interface CreateDepartmentFormProps {
  onSuccess: () => void;
}

const CreateDepartmentForm: React.FC<CreateDepartmentFormProps> = ({ onSuccess }) => {
  const { isLoading, error, createDepartment, clearError } = useCreateDepartment();

  const [form, setForm] = useState({
    departmentname: "",
    departmentcode: "",
    description: "",
    isactive: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    clearError();
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createDepartment({
      departmentname: form.departmentname.trim(),
      departmentcode: form.departmentcode.trim().toUpperCase(),
      description: form.description.trim() || null,
      isactive: form.isactive,
    });
    if (result) {
      toast.success(`Department "${result.departmentname}" created!`);
      setForm({ departmentname: "", departmentcode: "", description: "", isactive: true });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
      <div>
        <label htmlFor="dept-name" className="label">Department Name *</label>
        <input
          id="dept-name"
          name="departmentname"
          type="text"
          className="input-field"
          placeholder="e.g. Frontend Engineering"
          value={form.departmentname}
          onChange={handleChange}
          required
          maxLength={150}
        />
      </div>

      <div>
        <label htmlFor="dept-code" className="label">Department Code *</label>
        <input
          id="dept-code"
          name="departmentcode"
          type="text"
          className="input-field"
          placeholder="e.g. FE"
          value={form.departmentcode}
          onChange={handleChange}
          required
          maxLength={30}
          style={{ textTransform: "uppercase" }}
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
          Unique code. Cannot be changed after creation.
        </p>
      </div>

      <div>
        <label htmlFor="dept-desc" className="label">Description</label>
        <textarea
          id="dept-desc"
          name="description"
          className="input-field"
          placeholder="Brief description of the department…"
          value={form.description}
          onChange={handleChange}
          rows={3}
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <input
          id="dept-active"
          name="isactive"
          type="checkbox"
          checked={form.isactive}
          onChange={handleChange}
          style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)", cursor: "pointer" }}
        />
        <label htmlFor="dept-active" style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>
          Active department
        </label>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 1rem",
          fontSize: "0.8125rem",
          color: "var(--color-danger)",
        }}>
          {error}
        </div>
      )}

      <button
        id="create-dept-submit"
        type="submit"
        className="btn-primary"
        disabled={isLoading || !form.departmentname || !form.departmentcode}
        style={{ marginTop: "0.25rem" }}
      >
        {isLoading ? <><span className="spinner" /> Creating…</> : "Create Department"}
      </button>
    </form>
  );
};

export default CreateDepartmentForm;
