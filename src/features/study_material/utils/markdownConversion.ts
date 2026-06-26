import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/** Recover markdown when older clients stored the full API JSON as a string. */
export function normalizeStudyContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.includes('"content"')) {
    return raw;
  }
  try {
    const parsed = JSON.parse(trimmed) as { content?: string };
    if (typeof parsed.content === "string") return parsed.content;
  } catch {
    /* not JSON */
  }
  return raw;
}

let turndownService: TurndownService | null = null;

function getTurndownService(): TurndownService {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
    });
    turndownService.use(gfm);
  }
  return turndownService;
}

export function markdownToHtml(markdown: string): string {
  const normalized = normalizeStudyContent(markdown);
  return marked.parse(normalized, { async: false, gfm: true, breaks: true }) as string;
}

export function htmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<p><br></p>") {
    return "";
  }
  return getTurndownService().turndown(html).trim();
}
