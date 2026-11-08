# Changelog

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
