// src/features/spaces/components/CreateSpaceModal.tsx
/**
 * Modal for creating a new e-learning space.
 * On success, parent shows the InviteCodeModal with the auto-generated code.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { mentorService } from "../services/mentorService";
import {
  formatDepartmentLabel,
  readStoredMentorDepartment,
  storeMentorDepartment,
  type MentorDepartment,
} from "../utils/mentorDepartment";
import type { SpaceCreateRequest, SpaceResponse } from "../types/space.types";

interface CreateSpaceModalProps {
  onClose: () => void;
  onSuccess: (space: SpaceResponse) => void;
  onCreate: (payload: SpaceCreateRequest) => Promise<SpaceResponse>;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  onClose,
  onSuccess,
  onCreate,
}) => {
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [mentorDepartment, setMentorDepartment] = useState<MentorDepartment | null>(
    () => readStoredMentorDepartment()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMentorDepartment = async () => {
      setProfileError(null);
      try {
        const dept = await mentorService.getProfile();
        storeMentorDepartment(dept);
        setMentorDepartment(dept);
      } catch {
        const cached = readStoredMentorDepartment();
        if (cached) {
          setMentorDepartment(cached);
        } else {
          setProfileError(
            "Could not load your assigned department. Please sign out and sign in again."
          );
          toast.error("Could not load your department.");
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    loadMentorDepartment();
  }, []);

  const departmentId = mentorDepartment?.departmentid ?? "";
  const departmentLabel = formatDepartmentLabel(mentorDepartment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim() || !departmentId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const space = await onCreate({
        space_name: spaceName.trim(),
        description: description.trim() || null,
        department_id: departmentId,
      });
      toast.success("Space created and published!");
      onSuccess(space);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to create space.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal Center Wrapper */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        {/* Modal */}
        <div
          className="animate-fade-in"
          style={{
            pointerEvents: "auto",
            width: "min(520px, 95vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Create Learning Space
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "0.25rem",
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "1.5rem" }}>
          {/* Space name */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="cs-name" className="label">
              Space Name <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              id="cs-name"
              type="text"
              className="input-field"
              placeholder="e.g. FastAPI Mastery"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              required
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="cs-desc" className="label">
              Description{" "}
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <textarea
              id="cs-desc"
              className="input-field"
              placeholder="Briefly describe the purpose of this space…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: "vertical", minHeight: "80px" }}
            />
          </div>

          {/* Department — read-only, mentor's assigned department only */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="cs-dept" className="label">
              Your Department <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            {loadingProfile ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--color-text-muted)",
                  fontSize: "0.875rem",
                  padding: "0.625rem 0",
                }}
              >
                <span className="spinner" style={{ borderTopColor: "var(--color-primary)", width: "1rem", height: "1rem" }} />
                Loading your department…
              </div>
            ) : profileError ? (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-danger)",
                }}
              >
                {profileError}
              </div>
            ) : (
              <>
                <div
                  id="cs-dept"
                  className="input-field"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: "2.75rem",
                    cursor: "default",
                    background: "var(--color-surface-1)",
                    color: "var(--color-text-primary)",
                    fontWeight: 600,
                  }}
                >
                  {departmentLabel || "—"}
                </div>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Assigned by your administrator. You cannot create spaces in other departments.
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.8125rem",
                color: "var(--color-danger)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={
                isSubmitting ||
                !spaceName.trim() ||
                !departmentId ||
                loadingProfile ||
                !!profileError
              }
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  Creating…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create Learning Space
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default CreateSpaceModal;
