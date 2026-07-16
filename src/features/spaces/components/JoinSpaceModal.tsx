import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { spaceService } from "../services/spaceService";
import { createPortal } from "react-dom";
import { KeyRound, LogIn, X } from "lucide-react";

interface JoinSpaceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const JoinSpaceModal: React.FC<JoinSpaceModalProps> = ({ onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedInviteCode = inviteCode.trim();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedInviteCode) return;

    setIsSubmitting(true);
    try {
      await spaceService.joinSpace({ invite_code: normalizedInviteCode });
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
    <div className="learning-experience">
      <div
        onMouseDown={() => !isSubmitting && onClose()}
        className="space-entry-modal__backdrop"
      />
      <div className="space-entry-modal__positioner">
        <section
          className="space-entry-modal space-entry-modal--join animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-space-title"
          aria-describedby="join-space-description"
        >
          <header className="space-entry-modal__header">
            <div className="space-entry-modal__title">
              <span className="space-entry-modal__icon" aria-hidden="true"><LogIn size={19} /></span>
              <div>
                <h2 id="join-space-title">Join a Space</h2>
                <p id="join-space-description">Use the invite code shared by your mentor.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="space-entry-modal__close"
              aria-label="Close join space dialog"
              disabled={isSubmitting}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <form onSubmit={handleSubmit} className="space-entry-modal__form">
            <div className="space-entry-modal__field">
              <label className="label" htmlFor="invite-code">Invite Code</label>
              <div className="space-entry-modal__invite-field">
                <KeyRound size={18} aria-hidden="true" />
                <input
                  id="invite-code"
                  autoFocus
                  className="input-field"
                  placeholder="e.g. ABC123XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
              <p className="space-entry-modal__help">Paste the complete code exactly as it was shared with you.</p>
            </div>
            <footer className="space-entry-modal__actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !normalizedInviteCode}
            >
              {isSubmitting ? <><span className="spinner" />Joining…</> : <><LogIn size={17} aria-hidden="true" />Join Space</>}
            </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );

  return createPortal(
    <div className="learning-experience learning-portal">{modalContent}</div>,
    document.body,
  );
};

export default JoinSpaceModal;
