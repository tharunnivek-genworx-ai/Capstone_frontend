import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { accountService } from "../services/accountService";
import type { MentorOut } from "../types/account.types";
import { spaceService } from "../../spaces/services/spaceService";
import type { AdminMentorSpaceOut, AdminMentorTransferredSpaceIn } from "../../spaces/types/space.types";

interface TransferOwnershipModalProps {
  mentor: MentorOut;
  onClose: () => void;
  onSuccess: () => void;
  /** When set, shows a final action after transfers (e.g. deactivate mentor). */
  proceedLabel?: string;
  onProceed?: () => Promise<boolean>;
}

const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  mentor,
  onClose,
  onSuccess,
  proceedLabel,
  onProceed,
}) => {
  const [spaces, setSpaces] = useState<AdminMentorSpaceOut[]>([]);
  const [transferredInSpaces, setTransferredInSpaces] = useState<
    AdminMentorTransferredSpaceIn[]
  >([]);
  const [targetMentors, setTargetMentors] = useState<MentorOut[]>([]);
  const [targetMentorId, setTargetMentorId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [transferringSpaceId, setTransferringSpaceId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [spaceRes, mentorRes] = await Promise.all([
        accountService.listMentorSpaces(mentor.mentorid),
        accountService.listMentors(1, 100, true),
      ]);
      setSpaces(spaceRes.owned_spaces);
      setTransferredInSpaces(spaceRes.transferred_in_spaces);
      const candidates = mentorRes.items.filter((m) => m.mentorid !== mentor.mentorid);
      setTargetMentors(candidates);
      if (candidates.length > 0) {
        setTargetMentorId(candidates[0].mentorid);
      }
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to load transfer data.");
    } finally {
      setIsLoading(false);
    }
  }, [mentor.mentorid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pendingSpaces = useMemo(
    () => spaces.filter((s) => s.needs_ownership_transfer),
    [spaces]
  );

  const refreshSpaces = async () => {
    const spaceRes = await accountService.listMentorSpaces(mentor.mentorid);
    setSpaces(spaceRes.owned_spaces);
    setTransferredInSpaces(spaceRes.transferred_in_spaces);
  };

  const transferSpace = async (space: AdminMentorSpaceOut) => {
    if (!targetMentorId) {
      toast.error("Select a mentor to transfer ownership to.");
      return false;
    }
    setTransferringSpaceId(space.space_id);
    try {
      await spaceService.transferOwnership(space.space_id, {
        transferred_to_mentor_id: targetMentorId,
      });
      toast.success(`"${space.space_name}" transferred.`);
      await refreshSpaces();
      return true;
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Transfer failed.");
      return false;
    } finally {
      setTransferringSpaceId(null);
    }
  };

  const handleTransferAll = async () => {
    if (pendingSpaces.length === 0) return;
    if (!targetMentorId) {
      toast.error("Select a mentor to transfer ownership to.");
      return;
    }
    setIsTransferring(true);
    try {
      for (const space of pendingSpaces) {
        setTransferringSpaceId(space.space_id);
        await spaceService.transferOwnership(space.space_id, {
          transferred_to_mentor_id: targetMentorId,
        });
      }
      toast.success(
        pendingSpaces.length === 1
          ? "Space ownership transferred."
          : `${pendingSpaces.length} spaces transferred.`
      );
      await refreshSpaces();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Transfer failed.");
      await refreshSpaces();
    } finally {
      setTransferringSpaceId(null);
      setIsTransferring(false);
    }
  };

  const handleProceed = async () => {
    if (!onProceed) return;
    setIsProceeding(true);
    try {
      const ok = await onProceed();
      if (ok) {
        onSuccess();
        onClose();
      }
    } finally {
      setIsProceeding(false);
    }
  };

  const canProceed = pendingSpaces.length === 0;
  const targetName = targetMentors.find((m) => m.mentorid === targetMentorId)?.fullname;

  const modalContent = (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem 1rem",
          pointerEvents: "none",
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            width: "min(640px, 96vw)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 96px rgba(0,0,0,0.65)",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
              Transfer Space Ownership
            </h2>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              Reassign learning spaces from <strong>{mentor.fullname}</strong> to another active mentor (EC-27).
            </p>
          </div>

          <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1 }}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <span className="spinner" style={{ width: "2rem", height: "2rem" }} />
              </div>
            ) : (
              <>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  Transfer to mentor
                </label>
                <select
                  className="input"
                  value={targetMentorId}
                  onChange={(e) => setTargetMentorId(e.target.value)}
                  disabled={targetMentors.length === 0 || isTransferring}
                  style={{ width: "100%", marginBottom: "1.25rem" }}
                >
                  {targetMentors.length === 0 ? (
                    <option value="">No other active mentors available</option>
                  ) : (
                    targetMentors.map((m) => (
                      <option key={m.mentorid} value={m.mentorid}>
                        {m.fullname} ({m.email})
                      </option>
                    ))
                  )}
                </select>

                {spaces.length === 0 && transferredInSpaces.length === 0 ? (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                    This mentor does not own any learning spaces and has no transferred spaces.
                  </p>
                ) : (
                  <>
                    {spaces.length > 0 && (
                      <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        Owned spaces ({spaces.length})
                      </span>
                      {pendingSpaces.length > 0 && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                          disabled={!targetMentorId || isTransferring}
                          onClick={() => void handleTransferAll()}
                        >
                          {isTransferring
                            ? "Transferring…"
                            : `Transfer all (${pendingSpaces.length})`}
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: transferredInSpaces.length > 0 ? "1.25rem" : 0 }}>
                      {spaces.map((space) => (
                        <div
                          key={space.space_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            padding: "0.75rem 0.875rem",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-bg-surface)",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>{space.space_name}</p>
                            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {space.needs_ownership_transfer
                                ? "Awaiting transfer"
                                : "Ownership already transferred"}
                            </p>
                          </div>
                          {space.needs_ownership_transfer && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", flexShrink: 0 }}
                              disabled={!targetMentorId || isTransferring}
                              onClick={() => void transferSpace(space)}
                            >
                              {transferringSpaceId === space.space_id ? "…" : "Transfer"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                      </>
                    )}

                    {transferredInSpaces.length > 0 && (
                      <>
                        <div style={{ marginBottom: "0.75rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                            Transferred spaces ({transferredInSpaces.length})
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {transferredInSpaces.map((space) => (
                            <div
                              key={space.space_id}
                              style={{
                                padding: "0.75rem 0.875rem",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                background: "var(--color-bg-surface-alt)",
                              }}
                            >
                              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>{space.space_name}</p>
                              <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                Transferred from {space.original_mentor_name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {targetName && pendingSpaces.length > 0 && (
                  <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Transfers assign effective ownership to {targetName}. Original mentor remains the audit owner.
                  </p>
                )}
              </>
            )}
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isTransferring || isProceeding}>
              Cancel
            </button>
            {onProceed && proceedLabel ? (
              <button
                type="button"
                className="btn-danger"
                disabled={!canProceed || isTransferring || isProceeding}
                onClick={() => void handleProceed()}
              >
                {isProceeding ? "Processing…" : proceedLabel}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                disabled={isTransferring}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default TransferOwnershipModal;
