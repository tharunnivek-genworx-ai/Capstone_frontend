// src/features/account_creation/components/CreateMentorForm.tsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCreateMentor } from "../hooks/useCreateMentor";
import { departmentService } from "../../department_creation/services/departmentService";
import type { DepartmentOut } from "../../department_creation/types/department.types";

interface CreateMentorFormProps {
  onSuccess: () => void;
}

const CreateMentorForm: React.FC<CreateMentorFormProps> = ({ onSuccess }) => {
  const { isLoading, error, createMentor, clearError } = useCreateMentor();
  const [departments, setDepartments] = useState<DepartmentOut[]>([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.listDepartments(1, 100);
        setDepartments(res.items.filter((d) => d.isactive));
      } catch {
        // silent — user will see empty dropdown
      }
    };
    fetchDepts();
  }, []);

  const [form, setForm] = useState({
    email: "",
    fullname: "",
    designation: "",
    departmentid: "",
    employeeid: "",
    phone: "",
    password: "",
    isactive: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    clearError();
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createMentor({
      email: form.email.trim(),
      fullname: form.fullname.trim(),
      designation: form.designation.trim(),
      departmentid: form.departmentid,
      employeeid: form.employeeid.trim() || null,
      phone: form.phone.trim() || null,
      password: form.password,
      isactive: form.isactive,
    });
    if (result) {
      toast.success(`Mentor "${result.fullname}" created!`);
      setForm({ email: "", fullname: "", designation: "", departmentid: "", employeeid: "", phone: "", password: "", isactive: true });
      onSuccess();
    }
  };

  const fields: Array<{ id: string; name: keyof typeof form; label: string; type: string; placeholder: string; required: boolean }> = [
    { id: "m-email", name: "email", label: "Email *", type: "email", placeholder: "mentor@company.com", required: true },
    { id: "m-fullname", name: "fullname", label: "Full Name *", type: "text", placeholder: "Jane Doe", required: true },
    { id: "m-designation", name: "designation", label: "Designation *", type: "text", placeholder: "Senior Engineer", required: true },
    { id: "m-empid", name: "employeeid", label: "Employee ID", type: "text", placeholder: "EMP-001", required: false },
    { id: "m-phone", name: "phone", label: "Phone", type: "tel", placeholder: "+91 9876543210", required: false },
    { id: "m-password", name: "password", label: "Password *", type: "password", placeholder: "Min. 8 characters", required: true },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {fields.slice(0, 4).map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="label">{f.label}</label>
            <input id={f.id} name={f.name} type={f.type} className="input-field" placeholder={f.placeholder} value={String(form[f.name])} onChange={handleChange} required={f.required} />
          </div>
        ))}
        <div>
          <label htmlFor="m-dept" className="label">Department *</label>
          <select id="m-dept" name="departmentid" className="input-field" value={form.departmentid} onChange={handleChange} required>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.departmentid} value={d.departmentid}>
                {d.departmentname} ({d.departmentcode})
              </option>
            ))}
          </select>
        </div>
        {fields.slice(4).map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="label">{f.label}</label>
            <input id={f.id} name={f.name} type={f.type} className="input-field" placeholder={f.placeholder} value={String(form[f.name])} onChange={handleChange} required={f.required} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <input id="m-active" name="isactive" type="checkbox" checked={form.isactive} onChange={handleChange} style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
        <label htmlFor="m-active" style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>Active account</label>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      <button id="create-mentor-submit" type="submit" className="btn-primary" disabled={isLoading || !form.email || !form.fullname || !form.designation || !form.departmentid || !form.password}>
        {isLoading ? <><span className="spinner" /> Creating…</> : "Create Mentor"}
      </button>
    </form>
  );
};

export default CreateMentorForm;
