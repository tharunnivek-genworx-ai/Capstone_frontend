// src/features/account_creation/components/CreateTraineeForm.tsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCreateTrainee } from "../hooks/useCreateTrainee";
import { departmentService } from "../../department_creation/services/departmentService";
import type { DepartmentOut } from "../../department_creation/types/department.types";

interface CreateTraineeFormProps {
  onSuccess: () => void;
}

const CreateTraineeForm: React.FC<CreateTraineeFormProps> = ({ onSuccess }) => {
  const { isLoading, error, createTrainee, clearError } = useCreateTrainee();
  const [departments, setDepartments] = useState<DepartmentOut[]>([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.listDepartments(1, 100, true);
        setDepartments(res.items);
      } catch {
        // silent
      }
    };
    fetchDepts();
  }, []);

  const [form, setForm] = useState({
    email: "",
    fullname: "",
    departmentid: "",
    employeeid: "",
    dob: "",
    phone: "",
    joiningdate: "",
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
    const result = await createTrainee({
      email: form.email.trim(),
      fullname: form.fullname.trim(),
      departmentid: form.departmentid,
      employeeid: form.employeeid.trim() || null,
      dob: form.dob || null,
      phone: form.phone.trim() || null,
      joiningdate: form.joiningdate || null,
      password: form.password,
      isactive: form.isactive,
    });
    if (result) {
      toast.success(`Trainee "${result.fullname}" created!`);
      setForm({ email: "", fullname: "", departmentid: "", employeeid: "", dob: "", phone: "", joiningdate: "", password: "", isactive: true });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label htmlFor="t-email" className="label">Email *</label>
          <input id="t-email" name="email" type="email" className="input-field" placeholder="trainee@company.com" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="t-fullname" className="label">Full Name *</label>
          <input id="t-fullname" name="fullname" type="text" className="input-field" placeholder="John Smith" value={form.fullname} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="t-dept" className="label">Department *</label>
          <select id="t-dept" name="departmentid" className="input-field" value={form.departmentid} onChange={handleChange} required>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.departmentid} value={d.departmentid}>
                {d.departmentname} ({d.departmentcode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="t-empid" className="label">Employee ID</label>
          <input id="t-empid" name="employeeid" type="text" className="input-field" placeholder="EMP-002" value={form.employeeid} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="t-dob" className="label">Date of Birth</label>
          <input id="t-dob" name="dob" type="date" className="input-field" value={form.dob} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="t-phone" className="label">Phone</label>
          <input id="t-phone" name="phone" type="tel" className="input-field" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="t-joining" className="label">Joining Date</label>
          <input id="t-joining" name="joiningdate" type="date" className="input-field" value={form.joiningdate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="t-password" className="label">Password *</label>
          <input id="t-password" name="password" type="password" className="input-field" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <input id="t-active" name="isactive" type="checkbox" checked={form.isactive} onChange={handleChange} style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
        <label htmlFor="t-active" style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>Active account</label>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      <button id="create-trainee-submit" type="submit" className="btn-primary" disabled={isLoading || !form.email || !form.fullname || !form.departmentid || !form.password}>
        {isLoading ? <><span className="spinner" /> Creating…</> : "Create Trainee"}
      </button>
    </form>
  );
};

export default CreateTraineeForm;
