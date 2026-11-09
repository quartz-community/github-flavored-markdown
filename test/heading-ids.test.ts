import { describe, it, expect } from "vitest";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { slugHeading, splitAnchor } from "@quartz-community/utils";
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

const ids = (html: string) => [...html.matchAll(/<h\d id="([^"]*)"/g)].map((m) => m[1]);

describe("heading ids", () => {
  it("are the same as rehype-slug's / GitHub's", async () => {
    const html = await render(
      "# Hello World\n\n## Foo\n\n## Foo\n\n## Foo 1\n\n## 监听 127.0.0.1（推荐）\n\n## `code` and **bold**\n",
    );
    expect(ids(html)).toEqual([
      "hello-world",
      "foo",
      "foo-1",
      "foo-1-1",
      "监听-127001推荐",
      "code-and-bold",
    ]);
  });

  // quartz-community/github-flavored-markdown#3
  it("are made from the heading as written, before SmartyPants", async () => {
    const html = await render(
      '## Range 1--2\n\n## The crosswalk\'s "identifier" contract...\n\n## Already — dashed\n',
    );
    expect(html).toContain("Range 1—2"); // still rendered with SmartyPants
    expect(ids(html)).toEqual([
      "range-1--2",
      "the-crosswalks-identifier-contract",
      "already--dashed",
    ]);
  });

  it("match GitHub's with SmartyPants off", async () => {
    const html = await render("## Range 1--2\n", { enableSmartyPants: false });
    expect(ids(html)).toEqual(["range-1--2"]);
  });

  it("keep an id a heading already has", async () => {
    const html = await render('<h2 id="custom">Custom</h2>\n\n## Custom\n');
    expect(html).toContain('id="custom"');
    expect(ids(html)).toContain("custom");
  });

  it("leave no helper attributes behind", async () => {
    const on = await render("## Range 1--2\n");
    const off = await render("## Range 1--2\n", { linkHeadings: false });
    expect(on).not.toContain("data-quartz");
    expect(off).not.toContain("data-quartz");
    expect(off).not.toContain("id=");
  });
});

// quartz-community/crawl-links#10
describe("alias ids for Obsidian's heading anchors", () => {
  it("add Obsidian's anchor as an alias when it slugs differently", async () => {
    const html = await render("## Colon:unspaced\n\n## A|B\n\n## Plain: spaced\n");
    expect(ids(html)).toEqual(["colonunspaced", "ab", "plain-spaced"]);
    expect(html).toContain('<span id="colon-unspaced" class="heading-alias"></span>');
    expect(html).toContain('<span id="a-b" class="heading-alias"></span>');
    // "Plain: spaced" → "Plain spaced" slugs to its own id: no alias
    expect(html.match(/heading-alias/g)).toHaveLength(2);
    // the alias is what a link written by Obsidian slugs to
    expect(splitAnchor("note#Colon unspaced")[1]).toBe("#colon-unspaced");
  });

  it("give the alias to the first heading only, and never shadow a real id", async () => {
    const html = await render("## a:b\n\n## a:b\n\n## a b\n");
    expect(ids(html)).toEqual(["ab", "ab-1", "a-b"]);
    expect(html).not.toContain("heading-alias");

    const first = await render("## x:y\n\n## x:y\n");
    expect(first.match(/id="x-y"/g)).toHaveLength(1);
    expect(first.indexOf('id="x-y"')).toBeLessThan(first.indexOf('id="xy-1"'));
  });
});

// quartz-community/crawl-links#4
describe("same-page anchor links", () => {
  it("point an anchor written as the heading's text at the heading", async () => {
    const html = await render(
      "## 监听 127.0.0.1（推荐）\n\n[x](<#监听 127.0.0.1（推荐）>)\n\n## Colon:here\n\n[y](<#Colon here>) [z](<#Colon:here>)\n",
    );
    expect(html).toContain(`href="#${slugHeading("监听 127.0.0.1（推荐）")}"`);
    expect(html).toContain('href="#colon-here"');
    expect(html).toContain('href="#colonhere"');
  });

  it("leave anchors that already name an id, or name none, alone", async () => {
    const html = await render("## Foo\n\n[a](#foo) [b](#user-defined) [c](<#Not a heading>)\n");
    expect(html).toContain('href="#foo"');
    expect(html).toContain('href="#user-defined"');
    expect(html).toContain('href="#Not%20a%20heading"');
  });
});
