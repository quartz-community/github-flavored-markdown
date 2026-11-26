import { describe, it, expect } from "vitest";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
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

  it("leave code, inline code and URLs alone", async () => {
    const html = await render("`a -> b`\n\n```\nc -> d\n```\n\n[e -> f](https://x.org/->)", {
      replacements: arrows,
    });
    expect(html).toContain("<code>a -> b</code>");
    expect(html).toContain("c -> d");
    expect(html).toContain('<a href="https://x.org/-%3E">e → f</a>');
  });

  it("keep a heading's id as written", async () => {
    const html = await render("## a -> b", { replacements: arrows });
    expect(html).toMatch(/<h2 id="a---b">a → b/);
    const plain = await render("## a -> b", { replacements: arrows, enableSmartyPants: false });
    expect(plain).toMatch(/<h2 id="a---b">a → b/);
  });
});
