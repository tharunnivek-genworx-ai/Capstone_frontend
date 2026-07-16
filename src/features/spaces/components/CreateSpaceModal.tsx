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
import { Building2, Plus, X } from "lucide-react";
import ModalPortal from "../../../components/ModalPortal";

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

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
    <ModalPortal>
      <div className="learning-experience">
        <div className="space-entry-modal__backdrop" onMouseDown={() => !isSubmitting && onClose()} />
        <div className="space-entry-modal__positioner">
          <section
            className="space-entry-modal animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-space-title"
            aria-describedby="create-space-description"
          >
        <header className="space-entry-modal__header">
          <div className="space-entry-modal__title">
            <span className="space-entry-modal__icon" aria-hidden="true"><Plus size={19} /></span>
            <div>
              <h2 id="create-space-title">Create Learning Space</h2>
              <p id="create-space-description">Set up a home for your topics and learners.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="space-entry-modal__close"
            aria-label="Close create learning space dialog"
            disabled={isSubmitting}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-entry-modal__form">
          <div className="space-entry-modal__field">
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

          <div className="space-entry-modal__field">
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
              maxLength={1000}
            />
            <span className="space-entry-modal__counter">{description.length}/1000</span>
          </div>

          <div className="space-entry-modal__field">
            <label htmlFor="cs-dept" className="label">
              Your Department <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            {loadingProfile ? (
              <div className="space-entry-modal__inline-status" role="status">
                <span className="spinner" />
                Loading your department…
              </div>
            ) : profileError ? (
              <div className="space-entry-modal__error" role="alert">
                {profileError}
              </div>
            ) : (
              <>
                <div
                  id="cs-dept"
                  className="space-entry-modal__department"
                >
                  <Building2 size={17} aria-hidden="true" />
                  {departmentLabel || "—"}
                </div>
                <p className="space-entry-modal__help">
                  Assigned by your administrator. You cannot create spaces in other departments.
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="space-entry-modal__error" role="alert">
              {error}
            </div>
          )}

          <footer className="space-entry-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
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
                  <Plus size={17} aria-hidden="true" />
                  Create Learning Space
                </>
              )}
            </button>
          </footer>
        </form>
          </section>
        </div>
      </div>
    </ModalPortal>
  );
};

export default CreateSpaceModal;
