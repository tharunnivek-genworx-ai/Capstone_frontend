import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

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
  return marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
}

export function htmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<p><br></p>") {
    return "";
  }
  return getTurndownService().turndown(html).trim();
}
