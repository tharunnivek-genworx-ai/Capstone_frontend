/**
 * Collect scroll depth (0–100) from the element that is actually scrolling.
 * Returns 100 only when content fits fully in the scrollport (nothing to scroll).
 * Returns 0 when the scrollport has no measurable content yet.
 */
export function measureScrollDepth(scrollHost: HTMLElement): number {
  const maxScroll = scrollHost.scrollHeight - scrollHost.clientHeight;
  if (maxScroll <= 0) {
    return scrollHost.scrollHeight > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((scrollHost.scrollTop / maxScroll) * 100));
}
