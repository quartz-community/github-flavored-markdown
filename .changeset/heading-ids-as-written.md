---
"@quartz-community/github-flavored-markdown": minor
---

Heading ids now come from the heading as written, so links to headings reach them:

- **Changed id:** with SmartyPants on (the default), a heading containing `--` now gets the same id as on GitHub: `## Range 1--2` → `range-1--2` (was `range-12`). A link that hard-codes the old id (`[x](#range-12)` or an external link to `page#range-12`) needs updating; `[[page#Range 1--2]]` and `[x](#range-1--2)` work. Other ids don't change.
- A link written by Obsidian to a heading containing `:`, `|`, `^`, `#` or `\` (Obsidian replaces these with spaces, e.g. `[[note#Colon unspaced]]` for `## Colon:unspaced`) now reaches the heading, through an extra id on an empty `<span class="heading-alias">` inside it.
- A same-page link written as a heading's text, such as `[x](<#My Heading>)`, now points at the heading's id.

Heading ids use the shared `slugHeading` from `@quartz-community/utils`, which links and table-of-contents entries use too. This replaces `rehype-slug`; ids for all other headings are unchanged.
