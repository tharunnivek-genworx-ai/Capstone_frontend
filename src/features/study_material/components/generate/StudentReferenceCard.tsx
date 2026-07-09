import { Link2 } from "lucide-react";

interface StudentReferenceCardProps {
  nodeMediaCount: number;
  onOpenMediaModal: () => void;
}

export default function StudentReferenceCard({
  nodeMediaCount,
  onOpenMediaModal,
}: StudentReferenceCardProps) {
  return (
    <div className="gsm-card gsm-student-ref-card">
      <h3 className="gsm-ready-title">For students reference</h3>
      <p className="gsm-ready-sub gsm-student-ref-card__sub">
        Students will refer to any additional resources that you provide
      </p>

      <button
        type="button"
        className="gsm-source-btn gsm-student-ref-card__btn"
        onClick={onOpenMediaModal}
        title="Images, links and videos for learners"
      >
        <div className="gsm-source-btn__icon" aria-hidden="true">
          <Link2 size={18} strokeWidth={1.8} />
        </div>
        <div className="gsm-source-btn__text">
          <b>Linked resources</b>
          <span>
            {nodeMediaCount > 0
              ? `${nodeMediaCount} attached to this topic`
              : "Add links, images, or videos for students"}
          </span>
        </div>
        {nodeMediaCount > 0 && (
          <span className="gsm-badge-count">{nodeMediaCount} linked</span>
        )}
      </button>
    </div>
  );
}
