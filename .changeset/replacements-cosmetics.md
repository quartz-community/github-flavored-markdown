---
"@quartz-community/github-flavored-markdown": patch
---

`replacements`:

- An autolink's text, its URL, stays as written (`https://e.com/q->r` showed `q→r`).
- A wikilink's alias is replaced like a Markdown link's text (`[[a|x -> y]]` was left alone while `[x -> y](a)` was replaced); an embed's alias is not, like an image's alt text.
- A backslash-escaped character (or a character reference) keeps a key literal: `a\->b` stays `a->b`.
- A heading changed by `replacements` or SmartyPants keeps its text as written in `data-heading`, as its id and Obsidian's links already did (`## a -> b` got `data-heading="a → b"` and `id="a---b"`).
