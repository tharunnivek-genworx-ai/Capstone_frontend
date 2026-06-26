// TeachingLineSelector.tsx
// Full-width teaching line button + 3-option mode tray dropdown + first-visit badge.
// Internal state: tray open/close. External state: selected mode (via onChange).
import React, { useState, useEffect } from "react";
import { ChevronDown, Pencil, Link2, PenLine, Target, Check } from "lucide-react";
import type { EffectiveInstructionPart } from "../../../spaces/types/node.types";

export type InstructionMode = "inherit" | "extend" | "replace";

const FIRST_VISIT_KEY = "studyguru_seen_teaching_line";

interface TrayOption {
  mode: InstructionMode;
  Icon: React.FC<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  desc: string;
}

const TRAY_OPTIONS: TrayOption[] = [
  {
    mode: "inherit",
    Icon: Link2,
    title: "Follow section style",
    desc: "Use the same approach set for this whole section.",
  },
  {
    mode: "extend",
    Icon: PenLine,
    title: "Add a note",
    desc: "Keep the section style, but add one extra instruction for this topic.",
  },
  {
    mode: "replace",
    Icon: Target,
    title: "Write my own",
    desc: "Ignore the section style. AI only uses what you write here.",
  },
];

function getModeSummary(mode: InstructionMode): React.ReactNode {
  switch (mode) {
    case "inherit":
      return (
        <>
          AI will <strong>follow the section style</strong>
        </>
      );
    case "extend":
      return (
        <>
          AI will <strong>follow the section style + your note</strong>
        </>
      );
    case "replace":
      return (
        <>
          AI will use <strong>your own instructions</strong> only
        </>
      );
  }
}

interface TeachingLineSelectorProps {
  mode: InstructionMode;
  onChange: (mode: InstructionMode) => void;
  /** effective_instruction_parts from the node — used for tray footer */
  previewParts: EffectiveInstructionPart[];
  /** When false, only the mode selector is shown (context panel hidden by parent) */
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export default function TeachingLineSelector({
  mode,
  onChange,
  previewParts,
  isExpanded = true,
  onToggleExpanded,
}: TeachingLineSelectorProps) {
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [showFirstVisit, setShowFirstVisit] = useState(false);

  // First-visit badge: show once per browser, auto-dismiss after 8 s
  useEffect(() => {
    try {
      if (!localStorage.getItem(FIRST_VISIT_KEY)) {
        setShowFirstVisit(true);
        const t = setTimeout(() => setShowFirstVisit(false), 8000);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable in private / restricted contexts
    }
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
    } catch {
      // ignore
    }
    setShowFirstVisit(false);
  };

  const openTray = () => {
    setIsTrayOpen(true);
    markSeen();
  };

  const closeTray = () => setIsTrayOpen(false);

  const toggleTray = () => {
    if (isTrayOpen) closeTray();
    else openTray();
  };

  const handleSelectMode = (m: InstructionMode) => {
    onChange(m);
    // Brief delay so the user sees the check activate before the tray closes
    setTimeout(closeTray, 180);
  };

  // Show the inherited section style in the tray footer
  const inheritedPart = previewParts.find(
    (p) => p.type === "inherited" || p.type === "branch-default"
  );

  return (
    <div
      className={`gsm-teaching-line__wrapper${
        !isExpanded ? " gsm-teaching-line__wrapper--collapsed" : ""
      }`}
    >
      {/* Label row with collapse toggle */}
      <div className="gsm-teaching-line__label-row">
        <button
          type="button"
          className="gsm-teaching-line__section-toggle"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="gsm-teaching-style-context"
        >
          <span className="gsm-label gsm-teaching-line__section-label">Teaching style</span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`gsm-teaching-line__section-chevron${
              isExpanded ? " gsm-teaching-line__section-chevron--open" : ""
            }`}
            aria-hidden={true}
          />
        </button>
        {isExpanded && (
          <span className="gsm-muted-helper">
            Click to choose how AI should approach this topic
          </span>
        )}
      </div>

      {/* First-visit badge */}
      {showFirstVisit && (
        <div className="gsm-first-visit-badge" role="status" aria-live="polite">
          ✦ Start here — choose how AI writes this lesson
        </div>
      )}

      {/* Teaching line button */}
      <button
        type="button"
        className={`gsm-teaching-line${isTrayOpen ? " gsm-teaching-line--open" : ""}`}
        onClick={toggleTray}
        aria-expanded={isTrayOpen}
        aria-haspopup="listbox"
        onKeyDown={(e) => {
          if (e.key === "Escape") closeTray();
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleTray();
          }
        }}
      >
        <Pencil
          size={13}
          strokeWidth={2}
          className="gsm-teaching-line__pencil"
          aria-hidden={true}
        />
        <span className="gsm-teaching-line__text">{getModeSummary(mode)}</span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={`gsm-teaching-line__chevron${
            isTrayOpen ? " gsm-teaching-line__chevron--open" : ""
          }`}
          aria-hidden={true}
        />
      </button>

      {/* Mode tray */}
      {isTrayOpen && (
        <>
          {/* Fixed backdrop — click outside closes tray */}
          <div
            className="gsm-overlay"
            onClick={closeTray}
            aria-hidden="true"
          />

          <div
            className="gsm-tray"
            role="listbox"
            aria-label="Teaching style options"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeTray();
            }}
          >
            <div className="gsm-tray__header">
              Choose how AI should approach this topic
            </div>

            <div className="gsm-tray__options">
              {TRAY_OPTIONS.map(({ mode: m, Icon, title, desc }) => {
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`gsm-tray__opt${isActive ? " gsm-tray__opt--active" : ""}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelectMode(m)}
                  >
                    <span className="gsm-tray__opt-check" aria-hidden="true">
                      {isActive && <Check size={9} strokeWidth={3} />}
                    </span>
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className="gsm-tray__opt-icon"
                      aria-hidden={true}
                    />
                    <div className="gsm-tray__opt-title">{title}</div>
                    <div className="gsm-tray__opt-desc">{desc}</div>
                  </button>
                );
              })}
            </div>

            {inheritedPart && (
              <div className="gsm-tray__footer">
                <span className="gsm-tray__footer-label">Section style:</span>
                <span className="gsm-tray__footer-val">
                  &ldquo;{inheritedPart.text}&rdquo;
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
