# Changelog

## 2.1.1

### Patch Changes

- b581f72: Uses Quartz's own `preact` instead of bundling a second copy (`noExternal` in the build overrode the externals). Components now share one Preact instance with Quartz and other plugins, so hooks and context work across them, and the bundle is smaller.

## 2.1.0

### Minor Changes

- 6ffbdf6: Heading ids now come from the heading as written, so links to headings reach them:

  - **Changed id:** with SmartyPants on (the default), a heading containing `--` now gets the same id as on GitHub: `## Range 1--2` → `range-1--2` (was `range-12`). A link that hard-codes the old id (`[x](#range-12)` or an external link to `page#range-12`) needs updating; `[[page#Range 1--2]]` and `[x](#range-1--2)` work. Other ids don't change.
  - A link written by Obsidian to a heading containing `:`, `|`, `^`, `#` or `\` (Obsidian replaces these with spaces, e.g. `[[note#Colon unspaced]]` for `## Colon:unspaced`) now reaches the heading, through an extra id on an empty `<span class="heading-alias">` inside it.
  - A same-page link written as a heading's text, such as `[x](<#My Heading>)`, now points at the heading's id.

  Heading ids use the shared `slugHeading` from `@quartz-community/utils`, which links and table-of-contents entries use too. This replaces `rehype-slug`; ids for all other headings are unchanged.

## 2.0.0

### Major Changes

- 020474b: Run before `obsidian-flavored-markdown` (`defaultOrder` 40 → 30)

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

## 1.0.0

### Major Changes

- Stable 1.0 release. All `@quartz-community/*` dependencies now use `^1.0.0` ranges.

  Pre-1.0 caret ranges pinned the minor version (`^0.2.1` means `>=0.2.1 <0.3.0`), so
  published fixes to shared packages could never be resolved by dependents. Moving the
  ecosystem to 1.0 makes caret ranges behave conventionally.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial Quartz community plugin template.
