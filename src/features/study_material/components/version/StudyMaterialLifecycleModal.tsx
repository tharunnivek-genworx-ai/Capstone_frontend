import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface StudyMaterialLifecycleModalProps {
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const StudyMaterialLifecycleModal: React.FC<StudyMaterialLifecycleModalProps> = ({
  title,
  isSubmitting,
  onClose,
  children,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(isSubmitting);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
    onCloseRef.current = onClose;
  }, [isSubmitting, onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isSubmittingRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="sm-lifecycle-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="sm-lifecycle-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="sm-lifecycle-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button
            ref={initialFocusRef}
            type="button"
            className="sm-lifecycle-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={19} aria-hidden />
          </button>
        </header>
        <div className="sm-lifecycle-modal__body">{children}</div>
        <footer className="sm-lifecycle-modal__actions">
          <button
            type="button"
            className="sm-mentor-btn sm-mentor-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </footer>
      </section>
    </div>
  );
};

export default StudyMaterialLifecycleModal;
