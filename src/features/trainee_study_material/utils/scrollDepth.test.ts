import { describe, expect, it } from "vitest";
import { measureScrollDepth, resolveScrollContainer } from "./scrollDepth";

function styleEl(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, styles);
}

describe("resolveScrollContainer", () => {
  it("prefers the trainee page content host over a non-scrolling viewer scroll div", () => {
    const pageContent = document.createElement("div");
    pageContent.className = "trainee-study-material-page__content";
    styleEl(pageContent, { overflowY: "auto" });
    Object.defineProperty(pageContent, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(pageContent, "scrollHeight", { value: 2000, configurable: true });

    const viewerScroll = document.createElement("div");
    viewerScroll.className = "study-material-viewer__scroll";
    styleEl(viewerScroll, { overflowY: "visible" });
    Object.defineProperty(viewerScroll, "clientHeight", { value: 2000, configurable: true });
    Object.defineProperty(viewerScroll, "scrollHeight", { value: 2000, configurable: true });

    pageContent.appendChild(viewerScroll);
    document.body.appendChild(pageContent);

    expect(resolveScrollContainer(viewerScroll)).toBe(pageContent);

    pageContent.remove();
  });

  it("prefers the fullscreen content host", () => {
    const fullscreen = document.createElement("div");
    fullscreen.className = "trainee-study-material-fullscreen__content";
    styleEl(fullscreen, { overflowY: "auto" });

    const viewerScroll = document.createElement("div");
    viewerScroll.className = "study-material-viewer__scroll";
    styleEl(viewerScroll, { overflowY: "visible" });

    fullscreen.appendChild(viewerScroll);
    document.body.appendChild(fullscreen);

    expect(resolveScrollContainer(viewerScroll)).toBe(fullscreen);

    fullscreen.remove();
  });
});

describe("measureScrollDepth", () => {
  it("tracks scroll progress incrementally on the page content host", () => {
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

    const viewerScroll = document.createElement("div");
    viewerScroll.className = "study-material-viewer__scroll";
    styleEl(viewerScroll, { overflowY: "visible" });
    pageContent.appendChild(viewerScroll);
    document.body.appendChild(pageContent);

    expect(measureScrollDepth(viewerScroll)).toBe(0);

    Object.defineProperty(pageContent, "scrollTop", {
      value: 500,
      configurable: true,
    });
    // maxScroll = 1000 → 50%
    expect(measureScrollDepth(viewerScroll)).toBe(50);

    Object.defineProperty(pageContent, "scrollTop", {
      value: 1000,
      configurable: true,
    });
    expect(measureScrollDepth(viewerScroll)).toBe(100);

    pageContent.remove();
  });

  it("returns 100 when content fully fits in the scrollport", () => {
    const pageContent = document.createElement("div");
    pageContent.className = "trainee-study-material-page__content";
    styleEl(pageContent, { overflowY: "auto" });
    Object.defineProperty(pageContent, "clientHeight", { value: 800, configurable: true });
    Object.defineProperty(pageContent, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(pageContent, "scrollTop", { value: 0, configurable: true });

    const viewerScroll = document.createElement("div");
    pageContent.appendChild(viewerScroll);
    document.body.appendChild(pageContent);

    expect(measureScrollDepth(viewerScroll)).toBe(100);

    pageContent.remove();
  });
});
