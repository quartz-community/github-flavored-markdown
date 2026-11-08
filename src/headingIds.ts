import type { Root as MdastRoot, Nodes as MdastNodes, Heading } from "mdast";
import type { Root as HastRoot, Element, Nodes as HastNodes } from "hast";
import {
  HeadingSlugger,
  obsidianHeadingAnchor,
  resolveAnchorHref,
  slugHeading,
} from "@quartz-community/utils";

/**
 * Heading ids, made with the shared `slugHeading` from @quartz-community/utils so that they agree
 * with every link and table-of-contents entry that points at a heading.
 *
 * - Ids are the same as GitHub's and `rehype-slug`'s (which this replaces): `github-slugger` over
 *   the heading's text, repeats numbered `-1`, `-2`, headings that already have an id skipped.
 * - The text is the heading as written: SmartyPants rewrites (`--` → `—`, curly quotes, `…`) are
 *   undone first, so `## Range 1--2` gets `range-1--2` as on GitHub, not `range-12`.
 * - When Obsidian's anchor for a heading (`:|^#\` replaced by spaces) slugs differently from every
 *   id on the page, it is added as an alias id on an empty `<span>` inside the heading, so
 *   `[[note#Colon unspaced]]` reaches `## Colon:unspaced`. The first such heading wins, as in
 *   Obsidian.
 * - Same-page `#anchor` links written as a heading's text are pointed at the heading's id.
 */

/** hast property carrying a heading's SmartyPants rewrites from the Markdown to the HTML stage. */
const REWRITES_PROPERTY = "dataQuartzHeadingRewrites";

/** Text node → its value before SmartyPants ran. */
const originalText = new WeakMap<object, string>();

function eachMdastHeading(tree: MdastNodes, fn: (heading: Heading) => void): void {
  if (tree.type === "heading") {
    fn(tree);
    return;
  }
  if ("children" in tree) for (const child of tree.children) eachMdastHeading(child, fn);
}

function eachMdastText(node: MdastNodes, fn: (node: MdastNodes & { value: string }) => void) {
  if (node.type === "text") fn(node);
  if ("children" in node) for (const child of node.children) eachMdastText(child, fn);
}

/** Runs before SmartyPants: remembers each heading text node's value. */
export function remarkRememberHeadingText() {
  return (tree: MdastRoot) => {
    eachMdastHeading(tree, (heading) =>
      eachMdastText(heading, (text) => originalText.set(text, text.value)),
    );
  };
}

/** Runs after SmartyPants: records, on each heading it changed, `[rewritten, original]` pairs. */
export function remarkRecordHeadingRewrites() {
  return (tree: MdastRoot) => {
    eachMdastHeading(tree, (heading) => {
      const rewrites: [string, string][] = [];
      eachMdastText(heading, (text) => {
        const original = originalText.get(text);
        if (original !== undefined && original !== text.value)
          rewrites.push([text.value, original]);
      });
      if (rewrites.length === 0) return;
      heading.data ??= {};
      heading.data.hProperties = {
        ...heading.data.hProperties,
        [REWRITES_PROPERTY]: JSON.stringify(rewrites),
      };
    });
  };
}

function eachElement(node: HastNodes, fn: (el: Element) => void): void {
  if (node.type === "element") fn(node);
  if ("children" in node) for (const child of node.children) eachElement(child, fn);
}

const isHeading = (el: Element) => /^h[1-6]$/.test(el.tagName);

function takeRewrites(el: Element): [string, string][] {
  const raw = el.properties[REWRITES_PROPERTY];
  delete el.properties[REWRITES_PROPERTY];
  if (typeof raw !== "string") return [];
  try {
    return JSON.parse(raw) as [string, string][];
  } catch {
    return [];
  }
}

/**
 * A heading's text as `hast-util-to-string` gives it (what `rehype-slug` slugged), with each text
 * node SmartyPants rewrote replaced by its original value.
 */
export function headingText(el: Element, rewrites: [string, string][] = []): string {
  const pending = [...rewrites];
  let text = "";
  const walk = (node: HastNodes) => {
    if (node.type === "text") {
      const i = pending.findIndex(([rewritten]) => rewritten === node.value);
      if (i === -1) {
        text += node.value;
      } else {
        text += pending[i]![1];
        pending.splice(i, 1);
      }
    } else if ("children" in node) {
      for (const child of node.children) walk(child);
    }
  };
  walk(el);
  return text;
}

/** HTML stage: give headings their ids and alias ids, and point same-page anchors at them. */
export function rehypeHeadingIds() {
  return (tree: HastRoot) => {
    const slugger = new HeadingSlugger();
    const slugged: { el: Element; text: string }[] = [];

    eachElement(tree, (el) => {
      if (!isHeading(el)) return;
      const rewrites = takeRewrites(el);
      if (el.properties.id) return;
      const text = headingText(el, rewrites);
      el.properties.id = slugger.slug(text);
      slugged.push({ el, text });
    });

    const ids = new Set<string>();
    eachElement(tree, (el) => {
      const id = el.properties.id;
      if (typeof id === "string" && id !== "") ids.add(id);
    });

    for (const { el, text } of slugged) {
      const alias = slugHeading(obsidianHeadingAnchor(text));
      if (alias === "" || ids.has(alias)) continue;
      ids.add(alias);
      el.children.unshift({
        type: "element",
        tagName: "span",
        properties: { id: alias, className: ["heading-alias"] },
        children: [],
      });
    }

    eachElement(tree, (el) => {
      const href = el.properties.href;
      if (el.tagName === "a" && typeof href === "string" && href.startsWith("#")) {
        el.properties.href = resolveAnchorHref(href, ids);
      }
    });
  };
}
