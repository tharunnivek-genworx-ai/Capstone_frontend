import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { mentorService } from "../services/mentorService";
import type { TraineeOut } from "../services/mentorService";
import { spaceService } from "../services/spaceService";
import type { SpaceMemberSummary } from "../types/space.types";

interface ManageTraineesModalProps {
  spaceId: string;
  onClose: () => void;
}

type Tab = "enrolled" | "add";

const ManageTraineesModal: React.FC<ManageTraineesModalProps> = ({ spaceId, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>("enrolled");

  // ── Enrolled tab state ────────────────────────────────────────────────
  const [enrolled, setEnrolled] = useState<SpaceMemberSummary[]>([]);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ── Add tab state ─────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TraineeOut[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Load enrolled trainees ────────────────────────────────────────────
  const loadEnrolled = useCallback(async () => {
    setIsLoadingEnrolled(true);
    try {
      const data = await spaceService.getSpaceTrainees(spaceId);
      setEnrolled(data);
    } catch {
      toast.error("Failed to load enrolled trainees.");
    } finally {
      setIsLoadingEnrolled(false);
    }
  }, [spaceId]);

  useEffect(() => {
    loadEnrolled();
  }, [loadEnrolled]);

  // ── Debounced search ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (q: string) => {
    setIsSearching(true);
    try {
      const data = await mentorService.searchTrainees(q);
      setSearchResults(data);
    } catch {
      toast.error("Failed to search trainees.");
    } finally {
      setIsSearching(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      await spaceService.addTrainees(spaceId, {
        trainee_ids: Array.from(selectedIds),
      });
      toast.success(`${selectedIds.size} trainee${selectedIds.size > 1 ? "s" : ""} added!`);
      setSelectedIds(new Set());
      setQuery("");
      setSearchResults([]);
      // Reload enrolled list and switch to it
      await loadEnrolled();
      setActiveTab("enrolled");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to add trainees.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (traineeId: string, fullName: string) => {
    if (!window.confirm(`Remove "${fullName}" from this space?`)) return;
    setRemovingId(traineeId);
    try {
      await spaceService.removeTrainee(spaceId, { trainee_id: traineeId });
      toast.success(`${fullName} removed from space.`);
      setEnrolled((prev) => prev.filter((t) => t.trainee_id !== traineeId));
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? e?.message ?? "Failed to remove trainee.");
    } finally {
      setRemovingId(null);
    }
  };

  // ── Tab style helpers ─────────────────────────────────────────────────
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    border: "none",
    borderBottom: isActive
      ? "2px solid var(--color-primary)"
      : "2px solid transparent",
    background: "none",
    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const joinedViaLabel = (via: string) =>
    via === "invite_code" ? "🔗 Invite" : "➕ Manual";

  // ── Render ────────────────────────────────────────────────────────────
  const modalContent = (
    <>
      {/* Backdrop */}
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

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem 1rem max(4rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      >
        <div
          className="animate-fade-in"
          style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          width: "min(560px, 96vw)",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 96px rgba(0,0,0,0.65)",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem 0",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Manage Learners
              </h2>
              <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {enrolled.length} enrolled
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                padding: "0.375rem",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            <button style={tabStyle(activeTab === "enrolled")} onClick={() => setActiveTab("enrolled")}>
              👥 Enrolled ({enrolled.length})
            </button>
            <button style={tabStyle(activeTab === "add")} onClick={() => setActiveTab("add")}>
              ➕ Add Trainees
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

          {/* ── Enrolled tab ── */}
          {activeTab === "enrolled" && (
            <div style={{ padding: "1rem 1.5rem" }}>
              {isLoadingEnrolled ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                  <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--color-primary)" }} />
                </div>
              ) : enrolled.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "16px",
                      background: "var(--color-surface-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 0.375rem", fontWeight: 600, color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                      No trainees enrolled
                    </p>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      Use the "Add Trainees" tab to enrol members.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="btn-primary"
                    style={{ padding: "0.5rem 1.25rem", fontSize: "0.8125rem" }}
                  >
                    ➕ Add Trainees
                  </button>
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {enrolled.map((t) => (
                    <li
                      key={t.trainee_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.875rem",
                        padding: "0.75rem 0.875rem",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {t.full_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.full_name}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.email}
                        </p>
                      </div>

                      {/* Join method badge */}
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "9999px",
                          background: t.joined_via === "invite_code" ? "rgba(14,165,233,0.12)" : "rgba(34,197,94,0.12)",
                          color: t.joined_via === "invite_code" ? "#0ea5e9" : "#22c55e",
                          border: `1px solid ${t.joined_via === "invite_code" ? "rgba(14,165,233,0.3)" : "rgba(34,197,94,0.3)"}`,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {joinedViaLabel(t.joined_via)}
                      </span>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(t.trainee_id, t.full_name)}
                        disabled={removingId === t.trainee_id}
                        title={`Remove ${t.full_name}`}
                        style={{
                          background: "none",
                          border: "1px solid transparent",
                          cursor: removingId === t.trainee_id ? "not-allowed" : "pointer",
                          color: "var(--color-text-muted)",
                          padding: "0.375rem",
                          borderRadius: "var(--radius-sm)",
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                          opacity: removingId === t.trainee_id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--color-danger)";
                          e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                          e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--color-text-muted)";
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        {removingId === t.trainee_id ? (
                          <span className="spinner" style={{ width: "1rem", height: "1rem" }} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="18" y1="8" x2="23" y2="13" />
                            <line x1="23" y1="8" x2="18" y2="13" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Add Trainees tab ── */}
          {activeTab === "add" && (
            <div style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

              {/* Search input */}
              <div style={{ position: "relative" }}>
                <input
                  autoFocus
                  className="input-field"
                  placeholder="Search by name, email, or employee ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: "2.5rem", boxSizing: "border-box" }}
                />
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-text-muted)" strokeWidth="2"
                  style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {isSearching && (
                  <span
                    className="spinner"
                    style={{ width: "1rem", height: "1rem", position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)" }}
                  />
                )}
              </div>

              {/* Selection info bar */}
              {selectedIds.size > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.875rem",
                    background: "rgba(37,99,235,0.08)",
                    border: "1px solid rgba(37,99,235,0.25)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-primary)" }}>
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--color-text-muted)", padding: "0.1rem 0.25rem" }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Results */}
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)",
                  minHeight: "160px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {query.trim().length < 2 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", gap: "0.5rem", color: "var(--color-text-muted)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p style={{ margin: 0, fontSize: "0.8125rem" }}>Type at least 2 characters to search</p>
                  </div>
                ) : searchResults.length === 0 && !isSearching ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                    No trainees found for "{query}"
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {searchResults.map((t) => {
                      const isSelected = selectedIds.has(t.traineeid);
                      const isAlreadyEnrolled = enrolled.some((e) => e.trainee_id === t.traineeid);
                      return (
                        <li
                          key={t.traineeid}
                          onClick={() => !isAlreadyEnrolled && toggleSelection(t.traineeid)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.625rem 0.875rem",
                            borderBottom: "1px solid var(--color-border)",
                            cursor: isAlreadyEnrolled ? "default" : "pointer",
                            background: isSelected ? "rgba(37,99,235,0.07)" : "transparent",
                            opacity: isAlreadyEnrolled ? 0.5 : 1,
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isAlreadyEnrolled && !isSelected)
                              e.currentTarget.style.background = "rgba(37,99,235,0.04)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            disabled={isAlreadyEnrolled}
                            style={{ cursor: isAlreadyEnrolled ? "default" : "pointer", width: "1rem", height: "1rem", flexShrink: 0 }}
                          />
                          {/* Avatar */}
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {t.fullname.charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.fullname}
                              {isAlreadyEnrolled && (
                                <span style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "#22c55e", fontWeight: 600 }}>Already enrolled</span>
                              )}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.email}{t.employeeid ? ` · ${t.employeeid}` : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

            </div>
          )}
        </div>

        {/* ── Pinned footer — always visible, never inside the scroll area ── */}
        {activeTab === "add" && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.625rem",
              padding: "0.875rem 1.5rem",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
            }}
          >
            <button onClick={onClose} className="btn-secondary" style={{ padding: "0.5rem 1rem" }}>
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              className="btn-primary"
              style={{ padding: "0.5rem 1.25rem" }}
              disabled={selectedIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} /> Adding…</>
              ) : (
                `Add ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""} to Space`
              )}
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );

  return createPortal(
    <div className="learning-experience learning-portal">{modalContent}</div>,
    document.body,
  );
};

export default ManageTraineesModal;
