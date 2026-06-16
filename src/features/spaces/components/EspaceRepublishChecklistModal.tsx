import React, { useState } from "react";
import toast from "react-hot-toast";
import type { RepublishChecklistNode } from "../types/space.types";
import { studyMaterialService } from "../../study_material/services/studyMaterialService";
import { quizService } from "../../quiz/services/quizService";

interface EspaceRepublishChecklistModalProps {
  spaceName: string;
  nodes: RepublishChecklistNode[];
  onClose: () => void;
}

type ChecklistKey = string;

function checklistKey(nodeId: string, kind: "material" | "quiz", quizId?: string | null): ChecklistKey {
  return kind === "material" ? `material:${nodeId}` : `quiz:${quizId ?? nodeId}`;
}

const EspaceRepublishChecklistModal: React.FC<EspaceRepublishChecklistModalProps> = ({
  spaceName,
  nodes,
  onClose,
}) => {
  const [completed, setCompleted] = useState<Set<ChecklistKey>>(new Set());
  const [publishingKey, setPublishingKey] = useState<ChecklistKey | null>(null);

  const markDone = (key: ChecklistKey) => {
    setCompleted((prev) => new Set(prev).add(key));
  };

  const handlePublishMaterial = async (node: RepublishChecklistNode) => {
    if (!node.last_published_version_id) return;
    const key = checklistKey(node.node_id, "material");
    setPublishingKey(key);
    try {
      await studyMaterialService.publish(node.node_id, {
        version_id: node.last_published_version_id,
      });
      markDone(key);
      toast.success(`${node.node_title} study material published.`);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: { message?: string } | string } } };
      const detail = e?.response?.data?.detail;
      const message =
        typeof detail === "object" && detail?.message
          ? detail.message
          : typeof detail === "string"
            ? detail
            : "Failed to publish study material.";
      toast.error(message);
    } finally {
      setPublishingKey(null);
    }
  };

  const handlePublishQuiz = async (node: RepublishChecklistNode) => {
    if (!node.quiz_id) return;
    const key = checklistKey(node.node_id, "quiz", node.quiz_id);
    setPublishingKey(key);
    try {
      await quizService.publish(node.node_id, node.quiz_id);
      markDone(key);
      toast.success(`${node.quiz_title ?? "Quiz"} published.`);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: { message?: string } | string } } };
      const detail = e?.response?.data?.detail;
      const message =
        typeof detail === "object" && detail?.message
          ? detail.message
          : typeof detail === "string"
            ? detail
            : "Failed to publish quiz.";
      toast.error(message);
    } finally {
      setPublishingKey(null);
    }
  };

  return (
    <>
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
        <div
          className="animate-fade-in"
          style={{
            pointerEvents: "auto",
            width: "min(560px, 95vw)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              Space is published — content needs to be re-published
            </h2>
            <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {spaceName}
            </p>
          </div>
          <div style={{ padding: "1.5rem", overflowY: "auto" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              Your space is now visible to trainees but no content has been re-published yet.
              Re-publish content to make it available:
            </p>
            {nodes.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                No publishable study material or quiz drafts were found in this space.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {nodes.flatMap((node) => {
                  const rows: React.ReactNode[] = [];
                  if (node.last_published_version_label && node.last_published_version_id) {
                    const key = checklistKey(node.node_id, "material");
                    const done = completed.has(key);
                    rows.push(
                      <li
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          padding: "0.625rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                          background: "var(--color-bg-surface)",
                        }}
                      >
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", flex: 1 }}>
                          {done && (
                            <span style={{ color: "#16a34a", marginRight: "0.375rem" }}>✓</span>
                          )}
                          {node.node_title} — {node.last_published_version_label} study material
                        </span>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", opacity: done ? 0.5 : 1 }}
                          disabled={done || publishingKey === key}
                          onClick={() => void handlePublishMaterial(node)}
                        >
                          {publishingKey === key ? "Publishing…" : done ? "Published" : "Publish"}
                        </button>
                      </li>
                    );
                  }
                  if (node.has_unpublished_quiz && node.quiz_id) {
                    const key = checklistKey(node.node_id, "quiz", node.quiz_id);
                    const done = completed.has(key);
                    rows.push(
                      <li
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          padding: "0.625rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                          background: "var(--color-bg-surface)",
                        }}
                      >
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", flex: 1 }}>
                          {done && (
                            <span style={{ color: "#16a34a", marginRight: "0.375rem" }}>✓</span>
                          )}
                          {node.quiz_title ?? `${node.node_title} — Quiz`}
                        </span>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", opacity: done ? 0.5 : 1 }}
                          disabled={done || publishingKey === key}
                          onClick={() => void handlePublishQuiz(node)}
                        >
                          {publishingKey === key ? "Publishing…" : done ? "Published" : "Publish Quiz"}
                        </button>
                      </li>
                    );
                  }
                  return rows;
                })}
              </ul>
            )}
            <button
              type="button"
              className="btn-secondary"
              style={{ width: "100%", marginTop: "1.25rem" }}
              onClick={onClose}
            >
              Done — I&apos;ll publish later
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EspaceRepublishChecklistModal;
