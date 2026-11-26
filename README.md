# @quartz-community/github-flavored-markdown

Adds GitHub Flavored Markdown support including autolink literals, footnotes, strikethrough, tables, task lists, SmartyPants typography and linked headings.

## Installation

```bash
npx quartz plugin add @quartz-community/github-flavored-markdown
```

## Usage

This plugin is already enabled in the default `quartz.config.yaml`:

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/github-flavored-markdown"
    enabled: true
    options:
      enableSmartyPants: true
      linkHeadings: true
    order: 30
```

This plugin must run before [obsidian-flavored-markdown](https://github.com/quartz-community/obsidian-flavored-markdown) (order `30` and `40` in the default config). If you set `order` on either plugin, keep this one first.

## Configuration

| Option              | Type      | Default | Description                                                                                                                                                                                                                                                                                          |
| ------------------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enableSmartyPants` | `boolean` | `true`  | Typographic enhancements: curly quotes, en/em dashes, ellipses.                                                                                                                                                                                                                                      |
| `linkHeadings`      | `boolean` | `true`  | Gives headings their `id`s and adds an anchor link to each. `false` also turns off heading ids, so links to headings (`[[page#Heading]]`) and section embeds no longer reach them (the table of contents plugin still adds ids on pages that show it).                                               |
| `singleTilde`       | `boolean` | `true`  | Strikes text between single tildes (`~text~`), as GitHub does. `false` strikes only `~~text~~`, as Obsidian does, so a `~` meaning "about" (`~20 W and (~€120)`) stays as written. Under obsidian-flavored-markdown's default `legacy` preset, which parses as Obsidian, single tildes never strike. |
| `replacements`      | `object`  | `{}`    | Text to replace as written, outside code, math and autolinks, before SmartyPants; the longest match wins. Empty: neither GitHub nor Obsidian replaces anything. See [Arrows](#arrows).                                                                                                               |

## Arrows

Quartz 4's Obsidian Flavored Markdown turned typed arrows into arrow characters (`parseArrows`). Obsidian doesn't, so Quartz 5 leaves them as typed. To render them as Quartz 4 did:

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/github-flavored-markdown"
    options:
      replacements:
        "->": "→"
        "-->": "⇒"
        "=>": "⇒"
        "==>": "⇒"
        "<-": "←"
        "<--": "⇐"
        "<=": "⇐"
        "<==": "⇐"
```

Text in code, inline code and math is left alone, and so is an autolink's text (`https://e.com/a->b`), which is its URL. A wikilink's alias (`[[note|a -> b]]`) is replaced like a Markdown link's text; an embed's alias (`![[pic.png|a -> b]]`) is not, like an image's alt text. A backslash before a character of a key keeps it as written: `a\->b` stays `a->b`. Note that `<=` then also replaces a "less than or equal" written in prose.

Under [Obsidian Flavored Markdown](https://github.com/quartz-community/obsidian-flavored-markdown)'s `preset: strict`, versions of it that bundle `@quartz-community/remark-obsidian` 2.2.3 or earlier re-parse a note holding a callout after these replacements and SmartyPants ran, which undoes them in that note.

## Heading ids

Heading ids are made from the heading as written, with the same slug function that links and the table of contents use, and match GitHub's and Obsidian's:

- With SmartyPants on, a heading containing `--` keeps it in its id: `## Range 1--2` → `range-1--2` (before Quartz 5.1: `range-12`). `[[page#Range 1--2]]` keeps working.
- A heading that SmartyPants or `replacements` changed keeps its text as written in Obsidian's `data-heading` attribute, too: `## a -> b` shows `a → b` and has `data-heading="a -> b"`.
- Headings containing `:`, `|`, `^`, `#` or `\` get an extra anchor with the id Obsidian links use (spaces instead of those characters), so such links and section embeds reach them.
- A same-page link written as a heading's text, such as `[x](<#My Heading>)`, points at the heading's id.

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/GitHubFlavoredMarkdown) for more information.

## License

MIT
