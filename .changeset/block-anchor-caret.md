---
"@quartz-community/github-flavored-markdown": patch
---

Same-page block links (`[x](#^id)`) are no longer pointed at a heading of the same name: they keep `#^id`, the block's id (with `@quartz-community/utils` 1.3.2 and rehype-obsidian 1.6.0, blocks are `id="^id"`, as in Obsidian).
