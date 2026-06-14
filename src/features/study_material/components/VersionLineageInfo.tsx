import React, { useEffect, useRef, useState } from "react";
import type { VersionLineageItem } from "../types/studyMaterial.types";

interface VersionLineageInfoProps {
  lineageChain: VersionLineageItem[];
  onSelectVersion: (versionId: string) => void;
  showHint?: boolean;
}

const VersionLineageInfo: React.FC<VersionLineageInfoProps> = ({
  lineageChain,
  onSelectVersion,
  showHint = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (lineageChain.length === 0) return null;

  return (
    <div className="version-lineage-info" ref={rootRef}>
      <button
        type="button"
        className="version-lineage-info__trigger"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="View previous versions of this draft"
        aria-label="View previous versions of this draft"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
      {showHint && (
        <span className="version-lineage-info__hint">(View previous versions of this draft)</span>
      )}
      {open && (
        <div
          className="version-lineage-info__popover"
          role="dialog"
          aria-label="Previous versions of this draft"
        >
          <p className="version-lineage-info__title">Previous versions</p>
          <ul className="version-lineage-info__list">
            {lineageChain.map((item) => (
              <li key={item.version_id}>
                <button
                  type="button"
                  className="version-lineage-info__link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVersion(item.version_id);
                    setOpen(false);
                  }}
                >
                  v{item.version_number}
                  {item.is_archived ? " (archived)" : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VersionLineageInfo;
