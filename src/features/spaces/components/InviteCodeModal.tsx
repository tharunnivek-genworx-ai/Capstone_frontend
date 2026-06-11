// src/features/spaces/components/InviteCodeModal.tsx
/**
 * Modal displayed after space creation (or triggered from space detail).
 * Shows the auto-generated invite code with a prominent copy-to-clipboard action.
 */

import React, { useState } from "react";
import toast from "react-hot-toast";

interface InviteCodeModalProps {
  inviteCode: string;
  spaceName: string;
  onClose: () => void;
}

const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  inviteCode,
  spaceName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — please copy manually.");
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
            width: "min(480px, 95vw)",
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
            padding: "1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, transparent 60%)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(34,197,94,0.3)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Space Created Successfully!
            </h2>
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {spaceName}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "1.75rem 1.5rem" }}>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              margin: "0 0 1.25rem",
              lineHeight: 1.6,
            }}
          >
            Share this invite code with trainees so they can join this space. Keep it safe!
          </p>

          {/* Invite code display */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1.5px dashed var(--color-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              textAlign: "center",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 0.75rem",
              }}
            >
              Invite Code
            </p>
            <code
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: "0.25em",
                color: "var(--color-primary)",
                fontFamily: "'Courier New', monospace",
                display: "block",
                wordBreak: "break-all",
              }}
            >
              {inviteCode}
            </code>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="btn-primary"
            style={{ width: "100%", padding: "0.875rem", fontSize: "0.9375rem" }}
          >
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy code to share with trainees
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ width: "100%", marginTop: "0.75rem" }}
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default InviteCodeModal;
