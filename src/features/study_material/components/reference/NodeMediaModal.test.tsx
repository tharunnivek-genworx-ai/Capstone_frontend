import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NodeMediaModal from "./NodeMediaModal";
import type { NodeMediaOut } from "../../types/studyMaterial.types";
import { referenceMaterialService } from "../../services/referenceMaterialService";

vi.mock("../../services/referenceMaterialService", () => ({
  referenceMaterialService: {
    mediaPublicUrl: vi.fn(),
    deleteNodeMedia: vi.fn(),
    attachNodeMediaFile: vi.fn(),
    attachNodeMediaLink: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const VIDEO_ID = "dQw4w9WgXcQ";
const YOUTUBE_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

function makeMedia(overrides: Partial<NodeMediaOut> = {}): NodeMediaOut {
  return {
    media_id: "media-1",
    node_id: "node-1",
    space_id: "space-1",
    media_type: "video_url",
    title: "Mentor video",
    url: YOUTUBE_URL,
    file_url: null,
    public_url: YOUTUBE_URL,
    order_index: 0,
    uploaded_by: "mentor-1",
    created_at: null,
    ...overrides,
  };
}

describe("NodeMediaModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens the in-app player from the Watch action on attached YouTube videos", async () => {
    const user = userEvent.setup();
    vi.mocked(referenceMaterialService.mediaPublicUrl).mockReturnValue(YOUTUBE_URL);

    render(
      <NodeMediaModal
        nodeId="node-1"
        nodeTitle="Topic A"
        nodeMedia={[makeMedia()]}
        onClose={vi.fn()}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Watch" }));

    expect(screen.getByTestId("youtube-player-modal")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mentor video" })).toBeInTheDocument();
  });

  it("opens non-YouTube video links externally", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    vi.mocked(referenceMaterialService.mediaPublicUrl).mockReturnValue("https://vimeo.com/123");

    render(
      <NodeMediaModal
        nodeId="node-1"
        nodeTitle="Topic A"
        nodeMedia={[makeMedia({ title: "Vimeo clip", url: "https://vimeo.com/123", public_url: "https://vimeo.com/123" })]}
        onClose={vi.fn()}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.queryByTestId("youtube-player-modal")).not.toBeInTheDocument();
    expect(openSpy).toHaveBeenCalledWith("https://vimeo.com/123", "_blank", "noopener,noreferrer");
  });

  it("shows Preview for pasted YouTube URLs before attach", async () => {
    const user = userEvent.setup();
    vi.mocked(referenceMaterialService.mediaPublicUrl).mockReturnValue(null);

    render(
      <NodeMediaModal
        nodeId="node-1"
        nodeTitle="Topic A"
        nodeMedia={[]}
        onClose={vi.fn()}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Video link" }));
    await user.type(screen.getByLabelText("Video URL"), YOUTUBE_URL);
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(screen.getByTestId("youtube-player-modal")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "YouTube video preview" })).toBeInTheDocument();
  });

  it("keeps article_link resources as external Open links", () => {
    vi.mocked(referenceMaterialService.mediaPublicUrl).mockReturnValue("https://example.com/article");

    render(
      <NodeMediaModal
        nodeId="node-1"
        nodeTitle="Topic A"
        nodeMedia={[
          makeMedia({
            media_type: "article_link",
            title: "Article",
            url: "https://example.com/article",
            public_url: "https://example.com/article",
          }),
        ]}
        onClose={vi.fn()}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const link = screen.getByRole("link", { name: "Open" });
    expect(link).toHaveAttribute("href", "https://example.com/article");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
