import remarkGfm from "remark-gfm";
import smartypants from "remark-smartypants";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { PluggableList } from "unified";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  rehypeHeadingIds,
  remarkRecordHeadingRewrites,
  remarkRememberHeadingText,
} from "./headingIds";
import { remarkTextReplacements } from "./textReplacements";

export interface GfmOptions {
  enableSmartyPants: boolean;
  linkHeadings: boolean;
  /**
   * Text to replace as written, applied before SmartyPants, outside code and math:
   * `{ "->": "→", "=>": "⇒" }` brings back Quartz 4's `parseArrows`. Empty by default: neither
   * GitHub nor Obsidian replaces anything.
   */
  replacements: Record<string, string>;
}

const defaultOptions: GfmOptions = {
  enableSmartyPants: true,
  linkHeadings: true,
  replacements: {},
};

export const GitHubFlavoredMarkdown: QuartzTransformerPlugin<Partial<GfmOptions>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "GitHubFlavoredMarkdown",
    markdownPlugins() {
      const rewrites: PluggableList = [];
      if (Object.keys(opts.replacements).length > 0)
        rewrites.push([remarkTextReplacements, opts.replacements]);
      if (opts.enableSmartyPants) rewrites.push(smartypants);
      if (rewrites.length === 0) return [remarkGfm];
      // Heading ids are made from the heading as written, so remember what the rewrites change
      return opts.linkHeadings
        ? [remarkGfm, remarkRememberHeadingText, ...rewrites, remarkRecordHeadingRewrites]
        : [remarkGfm, ...rewrites];
    },
    htmlPlugins() {
      if (opts.linkHeadings) {
        return [
          rehypeHeadingIds,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                role: "anchor",
                // A string: `true` renders as a bare `aria-hidden`, which isn't
                // "true", so the icon link was exposed as a link without a name
                // and an unknown role.
                ariaHidden: "true",
                tabIndex: -1,
                "data-no-popover": true,
              },
              content: {
                type: "element",
                tagName: "svg",
                properties: {
                  width: 18,
                  height: 18,
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                },
                children: [
                  {
                    type: "element",
                    tagName: "path",
                    properties: {
                      d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
                    },
                    children: [],
                  },
                  {
                    type: "element",
                    tagName: "path",
                    properties: {
                      d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
                    },
                    children: [],
                  },
                ],
              },
            },
          ],
        ];
      } else {
        return [];
      }
    },
  };
};
