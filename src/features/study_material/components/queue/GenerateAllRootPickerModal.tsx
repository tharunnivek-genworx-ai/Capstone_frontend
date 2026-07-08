import { useMemo, useState } from "react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";

export type RootQueueBusyStatus = "running" | "queued";

interface GenerateAllRootPickerModalProps {
  roots: NodeTreeNode[];
  initialSelectedRootIds?: string[];
  /** Roots currently in an active generate-all run — not selectable again. */
  busyRootStatusById?: Record<string, RootQueueBusyStatus | undefined>;
  onClose: () => void;
  onContinue: (rootIds: string[]) => void;
}

function countSubtopics(node: NodeTreeNode): number {
  return node.children.reduce((acc, child) => acc + 1 + countSubtopics(child), 0);
}

export default function GenerateAllRootPickerModal({
  roots,
  initialSelectedRootIds = [],
  busyRootStatusById = {},
  onClose,
  onContinue,
}: GenerateAllRootPickerModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => {
    const next = new Set(initialSelectedRootIds);
    for (const id of Array.from(next)) {
      if (busyRootStatusById[id]) next.delete(id);
    }
    return next;
  });

  const filteredRoots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roots;
    return roots.filter((root) => root.title.toLowerCase().includes(q));
  }, [query, roots]);

  const selectableCount = useMemo(
    () => roots.filter((root) => !busyRootStatusById[root.node_id]).length,
    [roots, busyRootStatusById],
  );

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 120 }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          zIndex: 130,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "min(640px, 96vw)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Choose sections to generate</h2>
            <p style={{ margin: "0.4rem 0 0", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
              Select one or more root sections. Generation runs one topic at a time
              (root, then each subtopic) using the normal generate path.
            </p>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "grid", gap: "0.75rem" }}>
            <input
              className="input-field"
              placeholder="Search sections..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "grid", gap: "0.45rem" }}>
              {filteredRoots.map((root) => {
                const busy = busyRootStatusById[root.node_id];
                const checked = selected.has(root.node_id);
                const subtopicCount = countSubtopics(root);
                const isBusy = Boolean(busy);
                return (
                  <label
                    key={root.node_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.6rem 0.75rem",
                      cursor: isBusy ? "not-allowed" : "pointer",
                      opacity: isBusy ? 0.72 : 1,
                      background: isBusy ? "var(--color-surface)" : "transparent",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
                      <input
                        type="checkbox"
                        checked={isBusy ? false : checked}
                        disabled={isBusy}
                        onChange={() => {
                          if (isBusy) return;
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(root.node_id)) next.delete(root.node_id);
                            else next.add(root.node_id);
                            return next;
                          });
                        }}
                      />
                      <span>{root.title}</span>
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.78rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                      }}
                    >
                      {isBusy ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            color:
                              busy === "running"
                                ? "var(--color-primary)"
                                : "var(--color-text-muted)",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {busy === "running" && (
                            <span
                              className="spinner"
                              style={{
                                width: "0.75rem",
                                height: "0.75rem",
                                borderWidth: "2px",
                                borderTopColor: "var(--color-primary)",
                              }}
                              aria-hidden
                            />
                          )}
                          {busy}
                        </span>
                      ) : (
                        <span>{subtopicCount} subtopics</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            {selectableCount === 0 && roots.length > 0 && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                All sections are already generating. Keep this tab open until the run finishes.
              </p>
            )}
          </div>
          <div
            style={{
              padding: "0.9rem 1.25rem",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.6rem",
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={selected.size === 0}
              onClick={() => onContinue(Array.from(selected))}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
