import { describe, it, expect } from "vitest";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import type { Root } from "mdast";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { GitHubFlavoredMarkdown, type GfmOptions } from "../src";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlugin = any;

async function render(md: string, options: Partial<GfmOptions> = {}): Promise<string> {
  const plugin = GitHubFlavoredMarkdown(options) as AnyPlugin;
  const file = await unified()
    .use(remarkParse)
    .use(plugin.markdownPlugins() as PluggableList)
    .use(remarkRehype)
    .use(plugin.htmlPlugins() as PluggableList)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

// Quartz 4's parseArrows mapping (obsidian-flavored-markdown#12)
const arrows = {
  "->": "→",
  "-->": "⇒",
  "=>": "⇒",
  "==>": "⇒",
  "<-": "←",
  "<--": "⇐",
  "<=": "⇐",
  "<==": "⇐",
};

describe("replacements", () => {
  it("replace nothing by default", async () => {
    expect(await render("a -> b", { enableSmartyPants: false })).toBe("<p>a -> b</p>");
  });

  it("replace prose, longest match first, before SmartyPants", async () => {
    expect(await render("a -> b, c => d, e <- f, g --> h, i <== j", { replacements: arrows })).toBe(
      "<p>a → b, c ⇒ d, e ← f, g ⇒ h, i ⇐ j</p>",
    );
  });

  it("ignore an empty key", async () => {
    expect(await render("a -> b", { replacements: { "": "x" }, enableSmartyPants: false })).toBe(
      "<p>a -> b</p>",
    );
    expect(
      await render("a -> b", { replacements: { "": "x", "->": "→" }, enableSmartyPants: false }),
    ).toBe("<p>a → b</p>");
  });

  it("escape keys that are regex syntax", async () => {
    expect(
      await render("(c) a.b acb ...", {
        replacements: { "(c)": "©", "a.b": "X", "...": "…" },
        enableSmartyPants: false,
      }),
    ).toBe("<p>© X acb …</p>");
  });

  it("leave code, inline code and URLs alone", async () => {
    const html = await render("`a -> b`\n\n```\nc -> d\n```\n\n[e -> f](https://x.org/->)", {
      replacements: arrows,
    });
    expect(html).toContain("<code>a -> b</code>");
    expect(html).toContain("c -> d");
    expect(html).toContain('<a href="https://x.org/-%3E">e → f</a>');
  });

  it("replace in a link whose text is not just its URL", async () => {
    expect(
      await render("[*a -> b*](https://x.org)", { replacements: arrows, enableSmartyPants: false }),
    ).toBe('<p><a href="https://x.org"><em>a → b</em></a></p>');
    // Text that starts with the URL is not an autolink when more follows
    expect(
      await render("[https://x.org*a -> b*](https://x.org)", {
        replacements: arrows,
        enableSmartyPants: false,
      }),
    ).toBe('<p><a href="https://x.org">https://x.org<em>a → b</em></a></p>');
  });

  it("keep a heading's id and data-heading as written", async () => {
    const html = await render("## a -> b", { replacements: arrows });
    expect(html).toMatch(/<h2 data-heading="a -> b" id="a---b">a → b/);
    const plain = await render("## a -> b", { replacements: arrows, enableSmartyPants: false });
    expect(plain).toMatch(/<h2 data-heading="a -> b" id="a---b">a → b/);
    const unlinked = await render("## a -> b", { replacements: arrows, linkHeadings: false });
    expect(unlinked).toBe('<h2 data-heading="a -> b">a → b</h2>');
    expect(
      await render("## a -> b", {
        replacements: arrows,
        linkHeadings: false,
        enableSmartyPants: false,
      }),
    ).toBe('<h2 data-heading="a -> b">a → b</h2>');
    // SmartyPants' rewrites too, as Obsidian has no SmartyPants
    expect(await render("## Range 1--2")).toMatch(/<h2 data-heading="Range 1--2" id="range-1--2">/);
    // Untouched headings are left to rehype-obsidian
    expect(await render("## plain", { replacements: arrows })).toMatch(/<h2 id="plain">/);
  });

  it("leave an autolink's text, its URL, as written", async () => {
    const html = await render(
      "https://e.com/q->r and www.e.com/s->t and <https://e.com/a=b> and a -> b",
      { replacements: arrows },
    );
    expect(html).toContain('<a href="https://e.com/q-%3Er">https://e.com/q->r</a>');
    expect(html).toContain('<a href="http://www.e.com/s-%3Et">www.e.com/s->t</a>');
    expect(html).toContain("and a → b");
  });

  it("keep a key with an escaped character literal", async () => {
    expect(
      await render("a\\->b, a-\\>b, a-&gt;b, a->b, \\\\->", {
        replacements: arrows,
        enableSmartyPants: false,
      }),
    ).toBe("<p>a->b, a->b, a->b, a→b, \\→</p>");
    // Lines after the first, in a quote, keep their offsets
    expect(
      await render("> x -> y\n> a\\->b c -> d", { replacements: arrows, enableSmartyPants: false }),
    ).toBe("<blockquote>\n<p>x → y\na->b c → d</p>\n</blockquote>");
    // An escape of a character outside the key leaves the key's characters to be replaced
    expect(await render("a \\* g --> h", { replacements: arrows, enableSmartyPants: false })).toBe(
      "<p>a * g ⇒ h</p>",
    );
    // Named, decimal and hexadecimal character references
    expect(
      await render("a &equals;> b c => d", { replacements: arrows, enableSmartyPants: false }),
    ).toBe("<p>a => b c ⇒ d</p>");
    expect(
      await render("a -&#62;b a -&#x3E;b c -> d", {
        replacements: arrows,
        enableSmartyPants: false,
      }),
    ).toBe("<p>a ->b a ->b c → d</p>");
  });

  it("replace in a wikilink's alias, not an embed's", async () => {
    // remark-obsidian's wikilink nodes, as obsidian-flavored-markdown reads them later
    const nodes: Array<{ type: string; alias?: string; embedded?: boolean }> = [];
    const wikilinks = () => (tree: Root) => {
      nodes.push(
        { type: "wikilink", alias: "x -> y" },
        { type: "wikilink", alias: "pic -> alt", embedded: true },
        { type: "wikilink" },
      );
      tree.children.push({ type: "paragraph", children: nodes as never });
    };
    const plugin = GitHubFlavoredMarkdown({ replacements: arrows }) as AnyPlugin;
    const processor = unified()
      .use(remarkParse)
      .use(wikilinks)
      .use(plugin.markdownPlugins() as PluggableList);
    await processor.run(processor.parse(""));
    expect(nodes.map((n) => n.alias)).toEqual(["x → y", "pic -> alt", undefined]);
  });
});

describe("SmartyPants", () => {
  it("can be turned off: quotes and dashes stay as written", async () => {
    expect(await render('"q" -- x', { enableSmartyPants: false })).toBe('<p>"q" -- x</p>');
    expect(await render('"q" -- x')).toBe("<p>“q” — x</p>");
  });
});
