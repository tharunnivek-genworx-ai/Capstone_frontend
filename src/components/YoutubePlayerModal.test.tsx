import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import YoutubePlayerModal from "./YoutubePlayerModal";
import { trackVideoEvent } from "../utils/videoAnalytics";

vi.mock("../utils/videoAnalytics", () => ({
  trackVideoEvent: vi.fn(),
}));

const VIDEO_ID = "dQw4w9WgXcQ";
const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

function renderModal(overrides: Partial<React.ComponentProps<typeof YoutubePlayerModal>> = {}) {
  const onClose = vi.fn();
  render(
    <YoutubePlayerModal
      isOpen
      onClose={onClose}
      videoId={VIDEO_ID}
      title="Test video"
      watchUrl={WATCH_URL}
      surface="trainee"
      mediaId="media-1"
      {...overrides}
    />,
  );
  return { onClose };
}

describe("YoutubePlayerModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
    document.body.style.overflow = "";
  });

  it("renders dialog semantics and labelled title", () => {
    renderModal();

    const dialog = screen.getByTestId("youtube-player-modal");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Test video" })).toBeInTheDocument();
  });

  it("tracks watch_in_app when opened with a valid embed", () => {
    renderModal({ surface: "mentor", nodeId: "node-1" });

    expect(trackVideoEvent).toHaveBeenCalledWith("watch_in_app", {
      surface: "mentor",
      nodeId: "node-1",
      mediaId: "media-1",
      videoId: VIDEO_ID,
      url: WATCH_URL,
    });
    expect(screen.getByTestId("youtube-player-iframe")).toHaveAttribute(
      "src",
      `https://www.youtube.com/embed/${VIDEO_ID}`,
    );
  });

  it("closes on Escape and restores body scroll", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    document.body.style.overflow = "hidden";

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the close button when opened", async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByTestId("youtube-player-close")).toHaveFocus();
    });
  });

  it("shows embed error UI and tracks embed_error after load timeout", () => {
    vi.useFakeTimers();
    renderModal();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByTestId("youtube-player-error")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to play this video here");
    expect(trackVideoEvent).toHaveBeenCalledWith(
      "embed_error",
      expect.objectContaining({ reason: "load_timeout", videoId: VIDEO_ID }),
    );

    const dialog = screen.getByTestId("youtube-player-modal");
    expect(dialog).toHaveAttribute("aria-describedby");
  });

  it("tracks open_external_fallback when Open in YouTube is clicked", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /open in youtube/i }));

    expect(trackVideoEvent).toHaveBeenCalledWith(
      "open_external_fallback",
      expect.objectContaining({
        surface: "trainee",
        videoId: VIDEO_ID,
        reason: "user_choice",
      }),
    );
    expect(openSpy).toHaveBeenCalledWith(WATCH_URL, "_blank", "noopener,noreferrer");
  });

  it("does not render when closed", () => {
    render(
      <YoutubePlayerModal
        isOpen={false}
        onClose={vi.fn()}
        videoId={VIDEO_ID}
        watchUrl={WATCH_URL}
        surface="trainee"
      />,
    );

    expect(screen.queryByTestId("youtube-player-modal")).not.toBeInTheDocument();
  });
});
