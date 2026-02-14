# @quartz-community/github-flavored-markdown

Adds GitHub Flavored Markdown support including tables, strikethrough, task lists, and autolinked headings.

## Installation

```bash
npx quartz plugin add github:quartz-community/github-flavored-markdown
```

## Usage

```ts
// quartz.config.ts
import * as ExternalPlugin from "./.quartz/plugins"

const config: QuartzConfig = {
  plugins: {
    transformers: [
      ExternalPlugin.GitHubFlavoredMarkdown(),
    ],
  },
}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enableSmartyPants | `boolean` | `true` | Whether to enable SmartyPants. |
| linkHeadings | `boolean` | `true` | Whether to link headings. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/) for more information.

## License

MIT
