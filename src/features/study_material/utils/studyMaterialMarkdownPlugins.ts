import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";

import "katex/dist/katex.min.css";

/** Markdown plugins for study material (GFM + LaTeX display/inline math). */
export const studyMaterialRemarkPlugins: PluggableList = [remarkMath];
export const studyMaterialRehypePlugins: PluggableList = [rehypeKatex];
