import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TraineeTopicResourcesPanel from "./TraineeTopicResourcesPanel";
import type { TraineeTopicResource } from "../../types/traineeNodePanel.types";
import { trackVideoEvent } from "../../../../utils/videoAnalytics";

vi.mock("../../../../utils/videoAnalytics", () => ({
  trackVideoEvent: vi.fn(),
}));

vi.mock("../../services/traineeTopicResourceService", () => ({
  downloadTraineeFile: vi.fn(),
  openTraineeFileInNewTab: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

const VIDEO_ID = "dQw4w9WgXcQ";

function makeResource(overrides: Partial<TraineeTopicResource> = {}): TraineeTopicResource {
  return {
    media_id: "media-1",
    media_type: "video_url",
    type_label: "Video",
    display_title: "Sample video",
    subtitle: null,
    view_action_label: "Watch",
    download_action_label: null,
    view_url: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    download_url: null,
    download_filename: null,
    mime_type: null,
    is_downloadable: false,
    order_index: 0,
    ...overrides,
  };
}

describe("TraineeTopicResourcesPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens the in-app YouTube player for YouTube video_url resources", async () => {
    const user = userEvent.setup();
    render(
      <TraineeTopicResourcesPanel
        resources={[makeResource()]}
        sectionTitle="Topic resources"
        emptyMessage="No resources"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Watch" }));

    expect(screen.getByTestId("youtube-player-modal")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sample video" })).toBeInTheDocument();
    expect(trackVideoEvent).toHaveBeenCalledWith(
      "watch_in_app",
      expect.objectContaining({
        surface: "trainee",
        mediaId: "media-1",
        videoId: VIDEO_ID,
      }),
    );
  });

  it("opens non-YouTube video_url resources externally", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    render(
      <TraineeTopicResourcesPanel
        resources={[
          makeResource({
            view_url: "https://vimeo.com/123456789",
            display_title: "Vimeo clip",
          }),
        ]}
        sectionTitle="Topic resources"
        emptyMessage="No resources"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Watch" }));

    expect(screen.queryByTestId("youtube-player-modal")).not.toBeInTheDocument();
    expect(openSpy).toHaveBeenCalledWith(
      "https://vimeo.com/123456789",
      "_blank",
      "noopener,noreferrer",
    );
    expect(trackVideoEvent).toHaveBeenCalledWith("open_external_fallback", {
      surface: "trainee",
      mediaId: "media-1",
      url: "https://vimeo.com/123456789",
      reason: "non_youtube",
    });
  });

  it("keeps article_link resources on the external open path", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    render(
      <TraineeTopicResourcesPanel
        resources={[
          makeResource({
            media_type: "article_link",
            type_label: "Article",
            view_action_label: "Read",
            view_url: "https://example.com/article",
            display_title: "Reference article",
          }),
        ]}
        sectionTitle="Topic resources"
        emptyMessage="No resources"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Read" }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/article",
      "_blank",
      "noopener,noreferrer",
    );
    expect(trackVideoEvent).not.toHaveBeenCalled();
  });
});
