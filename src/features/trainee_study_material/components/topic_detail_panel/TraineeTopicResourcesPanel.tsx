import React, { useState } from "react";
import toast from "react-hot-toast";
import type { TraineeTopicResource } from "../../types/traineeNodePanel.types";
import {
  downloadTraineeFile,
  openTraineeFileInNewTab,
} from "../../services/traineeTopicResourceService";

interface TraineeTopicResourcesPanelProps {
  resources: TraineeTopicResource[];
  sectionTitle: string;
  emptyMessage: string;
}

function resourcePath(fullUrl: string): string {
  try {
    const parsed = new URL(fullUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fullUrl;
  }
}

const TraineeTopicResourcesPanel: React.FC<TraineeTopicResourcesPanelProps> = ({
  resources,
  sectionTitle,
  emptyMessage,
}) => {
  const [isOpen, setIsOpen] = useState(resources.length > 0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const countLabel =
    resources.length === 0
      ? "None"
      : resources.length === 1
        ? "1 resource"
        : `${resources.length} resources`;

  const handleView = async (item: TraineeTopicResource) => {
    if (item.media_type === "video_url" || item.media_type === "article_link") {
      const opened = window.open(item.view_url, "_blank", "noopener,noreferrer");
      if (!opened) toast.error("Your browser blocked the new tab. Allow popups to view this resource.");
      return;
    }
    if (!item.mime_type) return;
    const opened = window.open("", "_blank");
    if (!opened) {
      toast.error("Your browser blocked the new tab. Allow popups to view this resource.");
      return;
    }
    opened.opener = null;
    setBusyId(item.media_id);
    try {
      await openTraineeFileInNewTab(resourcePath(item.view_url), item.mime_type, opened);
    } catch {
      opened.close();
      toast.error("Could not open this file.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (item: TraineeTopicResource) => {
    if (!item.download_url || !item.download_filename || !item.mime_type) return;
    setBusyId(item.media_id);
    try {
      await downloadTraineeFile(
        resourcePath(item.download_url),
        item.download_filename,
        item.mime_type
      );
    } catch {
      toast.error("Download failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="trainee-topic-resources">
      <button
        type="button"
        className="trainee-topic-resources__toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <span>{sectionTitle}</span>
        <span className="trainee-topic-resources__meta">
          <span>{countLabel}</span>
          <span>{isOpen ? "▾" : "▸"}</span>
        </span>
      </button>

      {isOpen && (
        <div className="trainee-topic-resources__body">
          {resources.length === 0 ? (
            <p className="trainee-topic-resources__empty">{emptyMessage}</p>
          ) : (
            <ul className="trainee-topic-resources__list">
              {resources.map((item) => (
                <li key={item.media_id} className="trainee-topic-resources__item">
                  <div className="trainee-topic-resources__main">
                    <span className="trainee-topic-resources__badge">{item.type_label}</span>
                    <div className="trainee-topic-resources__text">
                      <span className="trainee-topic-resources__title">{item.display_title}</span>
                      {item.subtitle && (
                        <span className="trainee-topic-resources__subtitle">{item.subtitle}</span>
                      )}
                    </div>
                  </div>
                  <div className="trainee-topic-resources__actions">
                    <button
                      type="button"
                      className="btn-secondary trainee-topic-resources__action"
                      disabled={busyId === item.media_id}
                      onClick={() => void handleView(item)}
                    >
                      {item.view_action_label}
                    </button>
                    {item.is_downloadable && item.download_action_label && (
                      <button
                        type="button"
                        className="btn-primary trainee-topic-resources__action"
                        disabled={busyId === item.media_id}
                        onClick={() => void handleDownload(item)}
                      >
                        {item.download_action_label}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default TraineeTopicResourcesPanel;
