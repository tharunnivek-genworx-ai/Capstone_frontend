import { useCallback, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { NodeTreeNode } from "../../../spaces/types/node.types";

export type RootQueueBusyStatus = "running" | "queued";

export interface GenerateAllRootPickerSelection {
  nodeIds: string[];
  externalResearchNodeIds: string[];
}

interface GenerateAllRootPickerModalProps {
  roots: NodeTreeNode[];
  initialSelectedNodeIds?: string[];
  /** Preferred external-research flags keyed by node id (from topic pages or prior picks). */
  initialExternalResearchByNodeId?: Record<string, boolean>;
  /** Node ids currently in an active generate-all run — not selectable. */
  busyNodeIds?: Set<string>;
  onClose: () => void;
  onContinue: (selection: GenerateAllRootPickerSelection) => void;
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

interface TreeRowProps {
  node: NodeTreeNode;
  depth: number;
  expanded: Set<string>;
  selected: Set<string>;
  externalResearch: Set<string>;
  busyNodeIds: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onToggleSelect: (node: NodeTreeNode) => void;
  onToggleExternalResearch: (nodeId: string) => void;
  onSelectAllDescendants: (node: NodeTreeNode) => void;
  onClearDescendants: (node: NodeTreeNode) => void;
}

function TreeRow({
  node,
  depth,
  expanded,
  selected,
  externalResearch,
  busyNodeIds,
  onToggleExpand,
  onToggleSelect,
  onToggleExternalResearch,
  onSelectAllDescendants,
  onClearDescendants,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.node_id);
  const isChecked = selected.has(node.node_id);
  const researchOn = externalResearch.has(node.node_id);
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
  const rowBusy = isBusy || busyNodeIds.has(node.node_id);

  return (
    <>
      <div
        className={`batch-topic-row${isChecked ? " batch-topic-row--selected" : ""}${isBusy ? " batch-topic-row--busy" : ""}`}
        style={{ paddingLeft: `${0.65 + depth * 1.25}rem` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(node.node_id)}
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          className="batch-topic-row__chevron"
          data-visible={hasChildren}
        >
          <ChevronRight size={14} className={isExpanded ? "batch-topic-row__chevron-icon--expanded" : ""} />
        </button>

        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(node.node_id)}
          className={`batch-topic-row__title${depth === 0 ? " batch-topic-row__title--root" : ""}`}
          title={node.title}
        >
          {node.title}
        </button>

        <div className="batch-topic-row__controls">
          {isBusy && (
            <span className="batch-topic-row__status">
              Generating…
            </span>
          )}
          {isPartiallyBusy && !isBusy && (
            <span className="batch-topic-row__status batch-topic-row__status--muted">
              Partly queued
            </span>
          )}
          {hasChildren && selectableDescendantIds.length > 0 && !isBusy && (
            <span className="batch-topic-row__branch-actions">
              {!allDescendantsSelected && (
                <button
                  type="button"
                  onClick={() => onSelectAllDescendants(node)}
                  className="batch-topic-row__branch-action"
                >
                  Select all subtopics
                </button>
              )}
              {selectedDescendantCount > 0 && (
                <>
                  {!allDescendantsSelected && (
                    <span className="batch-topic-row__divider">
                      ·
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onClearDescendants(node)}
                    className="batch-topic-row__branch-action"
                  >
                    Clear subtopics
                  </button>
                </>
              )}
              {selectedDescendantCount > 0 && selectedDescendantCount < selectableDescendantIds.length && (
                <span className="batch-topic-row__status batch-topic-row__status--muted">
                  ({selectedDescendantCount}/{selectableDescendantIds.length})
                </span>
              )}
            </span>
          )}
          <label
            className={`batch-topic-row__research${isChecked ? " batch-topic-row__research--active" : ""}${
              !isChecked || rowBusy ? " batch-topic-row__research--disabled" : ""
            }`}
            title={
              rowBusy
                ? "This topic is already generating"
                : isChecked
                  ? "Enable external research for this topic only"
                  : "Select this topic first to enable external research"
            }
          >
            <input
              type="checkbox"
              checked={isChecked && researchOn}
              disabled={!isChecked || rowBusy}
              onChange={() => onToggleExternalResearch(node.node_id)}
              aria-label={`External research for ${node.title}`}
            />
            <span>Research</span>
          </label>
          <input
            type="checkbox"
            checked={isChecked}
            disabled={rowBusy}
            onChange={() => onToggleSelect(node)}
            aria-label={`Select ${node.title}`}
            className="batch-topic-row__checkbox"
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
            externalResearch={externalResearch}
            busyNodeIds={busyNodeIds}
            onToggleExpand={onToggleExpand}
            onToggleSelect={onToggleSelect}
            onToggleExternalResearch={onToggleExternalResearch}
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
  initialExternalResearchByNodeId = {},
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
  const [externalResearch, setExternalResearch] = useState<Set<string>>(() => {
    const next = new Set<string>();
    for (const [nodeId, enabled] of Object.entries(initialExternalResearchByNodeId)) {
      if (enabled && !busyNodeIds.has(nodeId)) next.add(nodeId);
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
  const researchSelectedCount = useMemo(
    () => Array.from(selected).filter((id) => externalResearch.has(id)).length,
    [selected, externalResearch],
  );

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
        if (next.has(node.node_id)) {
          next.delete(node.node_id);
          setExternalResearch((researchPrev) => {
            if (!researchPrev.has(node.node_id)) return researchPrev;
            const researchNext = new Set(researchPrev);
            researchNext.delete(node.node_id);
            return researchNext;
          });
        } else {
          next.add(node.node_id);
        }
        return next;
      });

      if (node.children.length > 0) {
        setExpanded((prev) => new Set(prev).add(node.node_id));
      }
    },
    [busyNodeIds],
  );

  const handleToggleExternalResearch = useCallback((nodeId: string) => {
    setExternalResearch((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

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
      setExternalResearch((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    },
    [busyNodeIds],
  );

  const handleClearSelection = () => {
    setSelected(new Set());
    setExternalResearch(new Set());
  };

  return (
    <>
      <div
        onClick={onClose}
        className="batch-topic-picker__backdrop"
      />
      <div className="batch-topic-picker__layer">
        <div
          className="batch-topic-picker"
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-topic-picker-title"
        >
          <div className="batch-topic-picker__header">
            <span className="topic-tree-modal__eyebrow">Generate all</span>
            <h2 id="batch-topic-picker-title">Choose topics to generate</h2>
            <p>
              Each checkbox selects only that topic&apos;s material. Use{" "}
              <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                Select all subtopics
              </strong>{" "}
              on a section to bulk-select its children without selecting the section itself.
              Turn on{" "}
              <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                Research
              </strong>{" "}
              per selected topic when you want external research for that topic only.
              Generation runs one topic at a time in the background.
            </p>
          </div>

          <div className="batch-topic-picker__body">
            <div className="batch-topic-picker__tools">
              <label className="batch-topic-picker__search">
                <Search size={16} aria-hidden="true" />
                <input
                  className="input-field"
                  placeholder="Search topics…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button type="button" className="btn-secondary" onClick={handleClearSelection}>
                Clear all
              </button>
            </div>

            <div className="batch-topic-picker__tree" role="tree" aria-label="Topics available for generation">
              {filteredRoots.length === 0 ? (
                <p className="batch-topic-picker__empty">
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
                    externalResearch={externalResearch}
                    busyNodeIds={busyNodeIds}
                    onToggleExpand={handleToggleExpand}
                    onToggleSelect={handleToggleSelect}
                    onToggleExternalResearch={handleToggleExternalResearch}
                    onSelectAllDescendants={handleSelectAllDescendants}
                    onClearDescendants={handleClearDescendants}
                  />
                ))
              )}
            </div>

            <p className="batch-topic-picker__summary" aria-live="polite">
              {selectedCount === 0
                ? "No topics selected yet."
                : `${selectedCount} topic${selectedCount === 1 ? "" : "s"} selected${
                    researchSelectedCount > 0
                      ? ` · external research on ${researchSelectedCount}`
                      : ""
                  }.`}
            </p>

            {selectableCount === 0 && roots.length > 0 && (
              <p className="batch-topic-picker__summary">
                All topics are already generating. Keep this tab open until the run finishes.
              </p>
            )}
          </div>

          <div className="batch-topic-picker__footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={selectedCount === 0}
              onClick={() =>
                onContinue({
                  nodeIds: Array.from(selected),
                  externalResearchNodeIds: Array.from(selected).filter((id) =>
                    externalResearch.has(id),
                  ),
                })
              }
            >
              Continue ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
