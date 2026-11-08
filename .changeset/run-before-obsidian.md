---
"@quartz-community/github-flavored-markdown": major
---

Run before `obsidian-flavored-markdown` (`defaultOrder` 40 → 30)

A combined micromark extension prepends its constructs, so where two plugins claim
the same character the **later-registered** one wins. With this plugin ordered after
`obsidian-flavored-markdown`, GFM owned every character both wanted — `~` most
visibly — and Obsidian's own tokenizers could not run at all.

Obsidian's strikethrough is not GFM's: it closes on the first `~~` it reaches,
honours no escape, and has no single-tilde form. Reproducing that needs this plugin
to register first.

Measured on `remark-obsidian`'s recorded Obsidian corpus: the reorder on its own is
behaviour-neutral (0 cases fixed, 0 broken, which also clears the one real risk —
both plugins claim `[`, GFM's footnote against Obsidian's wikilink), and it lets 21
strikethrough cases match with no regression.

Rendered output changes for notes using `~~`, hence the major bump.
