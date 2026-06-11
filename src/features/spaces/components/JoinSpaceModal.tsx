import React, { useState } from "react";
import toast from "react-hot-toast";
import { spaceService } from "../services/spaceService";
import { createPortal } from "react-dom";

interface JoinSpaceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const JoinSpaceModal: React.FC<JoinSpaceModalProps> = ({ onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    try {
      await spaceService.joinSpace({ invite_code: inviteCode.trim() });
      toast.success("Successfully joined the space!");
      onSuccess();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(error?.response?.data?.detail ?? error?.message ?? "Failed to join space. Please check the invite code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      />
      <div
        className="animate-fade-in"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "1.5rem",
          width: "min(400px, 95vw)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Join a Space
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label" htmlFor="invite-code">
              Invite Code
            </label>
            <input
              id="invite-code"
              autoFocus
              className="input-field"
              placeholder="e.g. ABC123XYZ"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "0.5rem 1rem" }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "0.5rem 1rem" }}
              disabled={isSubmitting || !inviteCode.trim()}
            >
              {isSubmitting ? <span className="spinner" /> : "Join"}
            </button>
          </div>
        </form>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default JoinSpaceModal;
