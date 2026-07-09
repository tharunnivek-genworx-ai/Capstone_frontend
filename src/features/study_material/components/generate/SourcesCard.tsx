import { useState } from "react";
import { BookOpen, ChevronDown, Link2, Upload } from "lucide-react";
import type { ReferenceMaterialOut } from "../../types/studyMaterial.types";

interface SourcesCardProps {
  referenceMaterial: ReferenceMaterialOut | null;
  nodeMediaCount: number;
  onOpenRefModal: () => void;
  onOpenMediaModal: () => void;
}

export default function SourcesCard({
  referenceMaterial,
  nodeMediaCount,
  onOpenRefModal,
  onOpenMediaModal,
}: SourcesCardProps) {
  const [isCardOpen, setIsCardOpen] = useState(false);

  return (
    <section
      className={`gsm-card gsm-card--collapsible${isCardOpen ? " gsm-card--open" : ""}`}
      id="gsm-sources-card"
    >
      <button
        type="button"
        className="gsm-card__toggle"
        onClick={() => setIsCardOpen((v) => !v)}
        aria-expanded={isCardOpen}
        aria-controls="gsm-sources-body"
      >
        <div className="gsm-card__head-left">
          <div className="gsm-card__icon" aria-hidden="true">
            <BookOpen size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="gsm-card__title">Give a reference material for the AI</h3>
            {!isCardOpen && (
              <p className="gsm-card__collapsed-hint">
                Share material you already use, and AI will factor it in before writing
                the lesson.
              </p>
            )}
          </div>
        </div>
        <div className="gsm-card__toggle-right">
          <span className="gsm-chip-optional">Optional</span>
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className="gsm-card__chevron"
            aria-hidden
          />
        </div>
      </button>

      {isCardOpen && (
        <div id="gsm-sources-body" className="gsm-card__body">
          <div className="gsm-source-row">
            <button
              type="button"
              className="gsm-source-btn"
              onClick={onOpenRefModal}
              title={
                referenceMaterial
                  ? `Reference: ${referenceMaterial.title}`
                  : "Add a reference PDF for the AI to use"
              }
            >
              <div className="gsm-source-btn__icon" aria-hidden="true">
                <Upload size={18} strokeWidth={1.8} />
              </div>
              <div className="gsm-source-btn__text">
                <b>
                  {referenceMaterial
                    ? referenceMaterial.title
                    : "Upload a reference PDF"}
                </b>
                <span>Add a document for AI to read</span>
              </div>
            </button>

            <button
              type="button"
              className="gsm-source-btn"
              onClick={onOpenMediaModal}
              title="Images, links and videos for learners — not used by the AI generator"
            >
              <div className="gsm-source-btn__icon" aria-hidden="true">
                <Link2 size={18} strokeWidth={1.8} />
              </div>
              <div className="gsm-source-btn__text">
                <b>Linked resources</b>
                <span>Already attached to this topic</span>
              </div>
              {nodeMediaCount > 0 && (
                <span className="gsm-badge-count">
                  {nodeMediaCount} linked
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
