import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";

export type RootQueueBusyStatus = "running" | "queued";

interface GenerateAllRootPickerModalProps {
  roots: NodeTreeNode[];
  initialSelectedNodeIds?: string[];
  /** Node ids currently in an active generate-all run — not selectable. */
  busyNodeIds?: Set<string>;
  onClose: () => void;
  onContinue: (nodeIds: string[]) => void;
}

function collectDescendantIds(node: NodeTreeNode): string[] {
  const ids: string[] = [];
  const walk = (n: NodeTreeNode) => {
    ids.push(n.node_id);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
}

function getSelectableDescendantIds(node: NodeTreeNode, busyNodeIds: Set<string>): string[] {
  return collectDescendantIds(node).filter(
    (id) => id !== node.node_id && !busyNodeIds.has(id),
  );
}

function nodeMatchesQuery(node: NodeTreeNode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (node.title.toLowerCase().includes(q)) return true;
  return node.children.some((child) => nodeMatchesQuery(child, query));
}

const branchActionStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--color-primary)",
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

interface TreeRowProps {
  node: NodeTreeNode;
  depth: number;
  expanded: Set<string>;
  selected: Set<string>;
  busyNodeIds: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onToggleSelect: (node: NodeTreeNode) => void;
  onSelectAllDescendants: (node: NodeTreeNode) => void;
  onClearDescendants: (node: NodeTreeNode) => void;
}

function TreeRow({
  node,
  depth,
  expanded,
  selected,
  busyNodeIds,
  onToggleExpand,
  onToggleSelect,
  onSelectAllDescendants,
  onClearDescendants,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.node_id);
  const isChecked = selected.has(node.node_id);
  const subtreeIds = collectDescendantIds(node);
  const selectableDescendantIds = getSelectableDescendantIds(node, busyNodeIds);
  const selectedDescendantCount = selectableDescendantIds.filter((id) =>
    selected.has(id),
  ).length;
  const allDescendantsSelected =
    selectableDescendantIds.length > 0 &&
    selectedDescendantCount === selectableDescendantIds.length;
  const isBusy = subtreeIds.every((id) => busyNodeIds.has(id)) && subtreeIds.length > 0;
  const isPartiallyBusy = !isBusy && subtreeIds.some((id) => busyNodeIds.has(id));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.45rem 0.55rem",
          paddingLeft: `${0.55 + depth * 1.1}rem`,
          borderRadius: "var(--radius-md)",
          background: isBusy ? "var(--color-surface)" : "transparent",
          opacity: isBusy ? 0.72 : 1,
        }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(node.node_id)}
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          style={{
            width: "1.25rem",
            height: "1.25rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            color: "var(--color-text-muted)",
            cursor: hasChildren ? "pointer" : "default",
            visibility: hasChildren ? "visible" : "hidden",
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(node.node_id)}
          style={{
            flex: 1,
            textAlign: "left",
            border: "none",
            background: "transparent",
            color: "var(--color-text-primary)",
            fontSize: "0.88rem",
            fontWeight: depth === 0 ? 600 : 500,
            cursor: hasChildren ? "pointer" : "default",
            padding: 0,
            minWidth: 0,
          }}
        >
          {node.title}
        </button>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {isBusy && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              Generating…
            </span>
          )}
          {isPartiallyBusy && !isBusy && (
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              Partly queued
            </span>
          )}
          {hasChildren && selectableDescendantIds.length > 0 && !isBusy && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap",
              }}
            >
              {!allDescendantsSelected && (
                <button
                  type="button"
                  onClick={() => onSelectAllDescendants(node)}
                  style={branchActionStyle}
                >
                  Select all subtopics
                </button>
              )}
              {selectedDescendantCount > 0 && (
                <>
                  {!allDescendantsSelected && (
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.72rem" }}>
                      ·
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onClearDescendants(node)}
                    style={branchActionStyle}
                  >
                    Clear subtopics
                  </button>
                </>
              )}
              {selectedDescendantCount > 0 && selectedDescendantCount < selectableDescendantIds.length && (
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  ({selectedDescendantCount}/{selectableDescendantIds.length})
                </span>
              )}
            </span>
          )}
          <input
            type="checkbox"
            checked={isChecked}
            disabled={isBusy || busyNodeIds.has(node.node_id)}
            onChange={() => onToggleSelect(node)}
            aria-label={`Select ${node.title}`}
            style={{
              width: "1rem",
              height: "1rem",
              cursor: isBusy || busyNodeIds.has(node.node_id) ? "not-allowed" : "pointer",
            }}
          />
        </div>
      </div>

      {hasChildren && isExpanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.node_id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            selected={selected}
            busyNodeIds={busyNodeIds}
            onToggleExpand={onToggleExpand}
            onToggleSelect={onToggleSelect}
            onSelectAllDescendants={onSelectAllDescendants}
            onClearDescendants={onClearDescendants}
          />
        ))}
    </>
  );
}

export default function GenerateAllRootPickerModal({
  roots,
  initialSelectedNodeIds = [],
  busyNodeIds = new Set(),
  onClose,
  onContinue,
}: GenerateAllRootPickerModalProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Set<string>>(() => {
    const next = new Set(initialSelectedNodeIds);
    for (const id of Array.from(next)) {
      if (busyNodeIds.has(id)) next.delete(id);
    }
    return next;
  });

  const filteredRoots = useMemo(
    () => roots.filter((root) => nodeMatchesQuery(root, query)),
    [roots, query],
  );

  const selectableCount = useMemo(() => {
    let count = 0;
    const walk = (node: NodeTreeNode) => {
      if (!busyNodeIds.has(node.node_id)) count += 1;
      node.children.forEach(walk);
    };
    roots.forEach(walk);
    return count;
  }, [roots, busyNodeIds]);

  const selectedCount = selected.size;

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleToggleSelect = useCallback(
    (node: NodeTreeNode) => {
      if (busyNodeIds.has(node.node_id)) return;

      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(node.node_id)) next.delete(node.node_id);
        else next.add(node.node_id);
        return next;
      });

      if (node.children.length > 0) {
        setExpanded((prev) => new Set(prev).add(node.node_id));
      }
    },
    [busyNodeIds],
  );

  const handleSelectAllDescendants = useCallback(
    (node: NodeTreeNode) => {
      const ids = getSelectableDescendantIds(node, busyNodeIds);
      if (ids.length === 0) return;

      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        return next;
      });
      setExpanded((prev) => new Set(prev).add(node.node_id));
    },
    [busyNodeIds],
  );

  const handleClearDescendants = useCallback(
    (node: NodeTreeNode) => {
      const ids = getSelectableDescendantIds(node, busyNodeIds);
      if (ids.length === 0) return;

      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    },
    [busyNodeIds],
  );

  const handleClearSelection = () => setSelected(new Set());

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
            width: "min(780px, 96vw)",
            maxHeight: "min(88vh, 720px)",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ padding: "1.1rem 1.35rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Choose topics to generate</h2>
            <p style={{ margin: "0.45rem 0 0", color: "var(--color-text-muted)", fontSize: "0.84rem", lineHeight: 1.45 }}>
              Each checkbox selects only that topic&apos;s material. Use{" "}
              <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                Select all subtopics
              </strong>{" "}
              on a section to bulk-select its children without selecting the section itself.
              Generation runs one topic at a time in the background.
            </p>
          </div>

          <div style={{ padding: "1rem 1.35rem", display: "grid", gap: "0.75rem", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <input
                className="input-field"
                placeholder="Search topics…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: "1 1 200px" }}
              />
              <button type="button" className="btn-secondary" onClick={handleClearSelection}>
                Clear all
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: "280px",
                maxHeight: "420px",
                overflowY: "auto",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.35rem",
              }}
            >
              {filteredRoots.length === 0 ? (
                <p style={{ margin: "1rem", fontSize: "0.84rem", color: "var(--color-text-muted)" }}>
                  No topics match your search.
                </p>
              ) : (
                filteredRoots.map((root) => (
                  <TreeRow
                    key={root.node_id}
                    node={root}
                    depth={0}
                    expanded={expanded}
                    selected={selected}
                    busyNodeIds={busyNodeIds}
                    onToggleExpand={handleToggleExpand}
                    onToggleSelect={handleToggleSelect}
                    onSelectAllDescendants={handleSelectAllDescendants}
                    onClearDescendants={handleClearDescendants}
                  />
                ))
              )}
            </div>

            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {selectedCount === 0
                ? "No topics selected yet."
                : `${selectedCount} topic${selectedCount === 1 ? "" : "s"} selected for generation.`}
            </p>

            {selectableCount === 0 && roots.length > 0 && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                All topics are already generating. Keep this tab open until the run finishes.
              </p>
            )}
          </div>

          <div
            style={{
              padding: "0.95rem 1.35rem",
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
              disabled={selectedCount === 0}
              onClick={() => onContinue(Array.from(selected))}
            >
              Continue ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
