import { useCallback, useEffect, useState } from "react";

export type GenerateAllDebugLevel = "info" | "ok" | "warn" | "error";

export interface GenerateAllDebugEvent {
  id: string;
  at: string;
  level: GenerateAllDebugLevel;
  title: string;
  detail?: string;
}

const MAX_EVENTS = 80;
const listeners = new Set<(events: GenerateAllDebugEvent[]) => void>();
let events: GenerateAllDebugEvent[] = [];

function emit() {
  for (const listener of listeners) {
    listener(events);
  }
}

export function clearGenerateAllDebug(): void {
  events = [];
  emit();
}

export function logGenerateAllDebug(
  level: GenerateAllDebugLevel,
  title: string,
  detail?: unknown,
): void {
  let detailText: string | undefined;
  if (detail !== undefined && detail !== null) {
    if (typeof detail === "string") detailText = detail;
    else {
      try {
        detailText = JSON.stringify(detail, null, 0);
      } catch {
        detailText = String(detail);
      }
    }
  }
  events = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toLocaleTimeString(),
      level,
      title,
      detail: detailText,
    },
    ...events,
  ].slice(0, MAX_EVENTS);
  emit();
}

export function useGenerateAllDebugLog(): GenerateAllDebugEvent[] {
  const [snap, setSnap] = useState<GenerateAllDebugEvent[]>(events);
  useEffect(() => {
    listeners.add(setSnap);
    setSnap(events);
    return () => {
      listeners.delete(setSnap);
    };
  }, []);
  return snap;
}

const levelColor: Record<GenerateAllDebugLevel, string> = {
  info: "var(--color-text-muted)",
  ok: "var(--color-success, #16a34a)",
  warn: "var(--color-warning, #d97706)",
  error: "var(--color-danger, #dc2626)",
};

export default function GenerateAllDebugPanel() {
  const log = useGenerateAllDebugLog();
  const [open, setOpen] = useState(true);
  const clear = useCallback(() => clearGenerateAllDebug(), []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          zIndex: 200,
          padding: "0.55rem 0.85rem",
          borderRadius: "999px",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-surface)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}
      >
        Debug log ({log.length})
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        zIndex: 200,
        width: "min(420px, calc(100vw - 2rem))",
        maxHeight: "min(420px, 50vh)",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.65rem 0.85rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <strong style={{ fontSize: "0.8125rem", flex: 1 }}>Generate-all debug</strong>
        <button type="button" className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }} onClick={clear}>
          Clear
        </button>
        <button type="button" className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }} onClick={() => setOpen(false)}>
          Hide
        </button>
      </div>
      <div style={{ overflowY: "auto", padding: "0.5rem 0.75rem", fontSize: "0.72rem", lineHeight: 1.4 }}>
        {log.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Events appear here when you run Generate study materials.
          </p>
        ) : (
          log.map((event) => (
            <div
              key={event.id}
              style={{
                padding: "0.45rem 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", gap: "0.45rem", alignItems: "baseline" }}>
                <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>{event.at}</span>
                <span style={{ color: levelColor[event.level], fontWeight: 700 }}>{event.title}</span>
              </div>
              {event.detail && (
                <pre
                  style={{
                    margin: "0.25rem 0 0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "var(--color-text-secondary)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: "0.68rem",
                  }}
                >
                  {event.detail}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
