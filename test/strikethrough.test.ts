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

// quartz-community/github-flavored-markdown#2
describe("strikethrough", () => {
  const md = "about ~20 W here and (~€120) there, ~~struck~~";

  it("strikes single tildes by default, as remark-gfm does", async () => {
    expect(await render(md)).toBe(
      "<p>about <del>20 W here and (</del>€120) there, <del>struck</del></p>",
    );
  });

  for (const enableSmartyPants of [true, false]) {
    it(`singleTilde: false strikes only ~~text~~ (SmartyPants ${enableSmartyPants})`, async () => {
      expect(await render(md, { singleTilde: false, enableSmartyPants })).toBe(
        "<p>about ~20 W here and (~€120) there, <del>struck</del></p>",
      );
    });
  }
});
