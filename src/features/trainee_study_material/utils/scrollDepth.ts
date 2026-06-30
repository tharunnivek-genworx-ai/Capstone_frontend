/** Find the nearest ancestor (or self) that is actually scrollable. */
export function resolveScrollContainer(anchor: HTMLElement): HTMLElement {
  const canScroll = (el: HTMLElement) => {
    const { overflowY } = getComputedStyle(el);
    return (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      el.scrollHeight > el.clientHeight + 1
    );
  };

  if (canScroll(anchor)) return anchor;

  let parent = anchor.parentElement;
  while (parent) {
    if (canScroll(parent)) return parent;
    parent = parent.parentElement;
  }

  return anchor;
}

/** Collect scroll depth (0–100) from the element that is actually scrolling. */
export function measureScrollDepth(anchor: HTMLElement): number {
  const scrollable = resolveScrollContainer(anchor);
  const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
  if (maxScroll <= 0) return 100;
  return Math.min(100, Math.round((scrollable.scrollTop / maxScroll) * 100));
}
