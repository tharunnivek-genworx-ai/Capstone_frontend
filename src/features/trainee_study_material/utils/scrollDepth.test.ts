import { describe, expect, it } from "vitest";
import { measureScrollDepth } from "./scrollDepth";

function styleEl(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, styles);
}

describe("measureScrollDepth", () => {
  it("tracks scroll progress incrementally on the provided scroll host", () => {
    const pageContent = document.createElement("div");
    pageContent.className = "trainee-study-material-page__content";
    styleEl(pageContent, { overflowY: "auto" });
    Object.defineProperty(pageContent, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(pageContent, "scrollHeight", { value: 1400, configurable: true });
    Object.defineProperty(pageContent, "scrollTop", {
      value: 0,
      writable: true,
      configurable: true,
    });

    document.body.appendChild(pageContent);

    expect(measureScrollDepth(pageContent)).toBe(0);

    Object.defineProperty(pageContent, "scrollTop", {
      value: 500,
      configurable: true,
    });
    // maxScroll = 1000 → 50%
    expect(measureScrollDepth(pageContent)).toBe(50);

    Object.defineProperty(pageContent, "scrollTop", {
      value: 1000,
      configurable: true,
    });
    expect(measureScrollDepth(pageContent)).toBe(100);

    pageContent.remove();
  });

  it("returns 100 when content fully fits in the scrollport", () => {
    const pageContent = document.createElement("div");
    pageContent.className = "trainee-study-material-page__content";
    styleEl(pageContent, { overflowY: "auto" });
    Object.defineProperty(pageContent, "clientHeight", { value: 800, configurable: true });
    Object.defineProperty(pageContent, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(pageContent, "scrollTop", { value: 0, configurable: true });

    document.body.appendChild(pageContent);

    expect(measureScrollDepth(pageContent)).toBe(100);

    pageContent.remove();
  });

  it("returns 0 when the scrollport has no measurable content yet", () => {
    const host = document.createElement("div");
    Object.defineProperty(host, "clientHeight", { value: 0, configurable: true });
    Object.defineProperty(host, "scrollHeight", { value: 0, configurable: true });
    Object.defineProperty(host, "scrollTop", { value: 0, configurable: true });

    expect(measureScrollDepth(host)).toBe(0);
  });

  it("measures the fullscreen content host the same way", () => {
    const fullscreen = document.createElement("div");
    fullscreen.className = "trainee-study-material-fullscreen__content";
    styleEl(fullscreen, { overflowY: "auto" });
    Object.defineProperty(fullscreen, "clientHeight", { value: 500, configurable: true });
    Object.defineProperty(fullscreen, "scrollHeight", { value: 1500, configurable: true });
    Object.defineProperty(fullscreen, "scrollTop", { value: 250, configurable: true });

    // maxScroll = 1000 → 25%
    expect(measureScrollDepth(fullscreen)).toBe(25);
  });
});
