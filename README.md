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

| Option              | Type      | Default | Description                                                                                                                                                                                                                                            |
| ------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enableSmartyPants` | `boolean` | `true`  | Typographic enhancements: curly quotes, en/em dashes, ellipses.                                                                                                                                                                                        |
| `linkHeadings`      | `boolean` | `true`  | Gives headings their `id`s and adds an anchor link to each. `false` also turns off heading ids, so links to headings (`[[page#Heading]]`) and section embeds no longer reach them (the table of contents plugin still adds ids on pages that show it). |

## Heading ids

Heading ids are made from the heading as written, with the same slug function that links and the table of contents use, and match GitHub's and Obsidian's:

- With SmartyPants on, a heading containing `--` keeps it in its id: `## Range 1--2` → `range-1--2` (before Quartz 5.1: `range-12`). `[[page#Range 1--2]]` keeps working.
- Headings containing `:`, `|`, `^`, `#` or `\` get an extra anchor with the id Obsidian links use (spaces instead of those characters), so such links and section embeds reach them.
- A same-page link written as a heading's text, such as `[x](<#My Heading>)`, points at the heading's id.

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/GitHubFlavoredMarkdown) for more information.

## License

MIT
