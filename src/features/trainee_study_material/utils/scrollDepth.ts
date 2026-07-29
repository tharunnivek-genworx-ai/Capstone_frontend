/** Preferred scroll hosts for the trainee reader (outer page scrolls, not the viewer). */
const KNOWN_SCROLL_HOST_SELECTORS = [
  ".trainee-study-material-page__content",
  ".trainee-study-material-fullscreen__content",
] as const;

function isOverflowScrollable(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el);
  return overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
}

function canScroll(el: HTMLElement): boolean {
  return isOverflowScrollable(el) && el.scrollHeight > el.clientHeight + 1;
}

/**
 * Find the nearest ancestor (or self) that is actually scrollable.
 * Prefer known trainee reader hosts so we don't attach to a non-scrolling
 * `.study-material-viewer__scroll` (overflow: visible in reader CSS).
 */
export function resolveScrollContainer(anchor: HTMLElement): HTMLElement {
  for (const selector of KNOWN_SCROLL_HOST_SELECTORS) {
    const host = anchor.closest(selector);
    if (host instanceof HTMLElement && isOverflowScrollable(host)) {
      return host;
    }
  }

  if (canScroll(anchor)) return anchor;

  let parent = anchor.parentElement;
  while (parent) {
    if (canScroll(parent)) return parent;
    parent = parent.parentElement;
  }

  // Fall back to nearest overflow:auto/scroll host even if content does not
  // overflow yet (layout may still be settling).
  if (isOverflowScrollable(anchor)) return anchor;
  parent = anchor.parentElement;
  while (parent) {
    if (isOverflowScrollable(parent)) return parent;
    parent = parent.parentElement;
  }

  return anchor;
}

/**
 * Collect scroll depth (0–100) from the element that is actually scrolling.
 * Returns 100 only when content fits fully in the scrollport (nothing to scroll).
 * Returns 0 when the scrollport has no measurable content yet.
 */
export function measureScrollDepth(anchor: HTMLElement): number {
  const scrollable = resolveScrollContainer(anchor);
  const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
  if (maxScroll <= 0) {
    return scrollable.scrollHeight > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((scrollable.scrollTop / maxScroll) * 100));
}
