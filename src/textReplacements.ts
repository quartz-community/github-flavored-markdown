import type { Root as MdastRoot, Nodes as MdastNodes, Link, Text } from "mdast";

/** remark-obsidian's wikilink node, before obsidian-flavored-markdown turns it into a link. */
interface WikilinkNode {
  type: "wikilink";
  alias?: string;
  embedded?: boolean;
}

/**
 * Replace text as written, such as `->` with `→`: Quartz 4's `parseArrows`, without a built-in
 * list. Only prose changes: code, inline code, math, HTML, URLs and link targets are not text
 * nodes, and an autolink's text (`<https://e.com/a->b>`, a bare `https://e.com/a->b`) is its URL,
 * so it stays as written too. A wikilink's alias (`[[note|a -> b]]`) is prose like a Markdown
 * link's text; an embed's alias (`![[pic.png|a -> b]]`) is not, like an image's alt text. A key
 * with a backslash-escaped or character-reference character (`a\->b`, `a-&gt;b`) stays literal.
 * The longest match wins (`-->` before `->`).
 */
export function remarkTextReplacements(replacements: Record<string, string>) {
  const keys = Object.keys(replacements)
    .filter((key) => key !== "")
    .sort((a, b) => b.length - a.length);
  if (keys.length === 0) return () => {};
  const pattern = new RegExp(
    keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const replace = (value: string, literal?: boolean[]) =>
    value.replace(pattern, (match, offset: number) => {
      if (literal?.slice(offset, offset + match.length).some(Boolean)) return match;
      return replacements[match] ?? match;
    });

  return (tree: MdastRoot, file?: { value?: unknown }) => {
    const source = typeof file?.value === "string" ? file.value : undefined;
    const walk = (node: MdastNodes) => {
      if (node.type === "text") {
        node.value = replace(node.value, source ? literalChars(node, source) : undefined);
        return;
      }
      if (node.type === "link" && isAutolink(node)) return;
      const wikilink = node as unknown as WikilinkNode;
      if (wikilink.type === "wikilink") {
        if (!wikilink.embedded && typeof wikilink.alias === "string")
          wikilink.alias = replace(wikilink.alias);
        return;
      }
      if ("children" in node) for (const child of node.children) walk(child);
    };
    walk(tree);
  };
}

/** A link whose only text is its URL, as written: `<https://…>`, a bare `https://…`, `www.…`. */
function isAutolink(node: Link): boolean {
  if (node.children.length !== 1 || node.children[0]!.type !== "text") return false;
  const text = node.children[0]!.value;
  return (
    node.url === text ||
    node.url === `mailto:${text}` ||
    node.url === `http://${text}` ||
    node.url === `https://${text}`
  );
}

const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;
const CHARACTER_REFERENCE = /^&(?:#\d{1,7}|#[xX][\da-fA-F]{1,6}|[A-Za-z][A-Za-z\d]{0,31});/;

/**
 * Which characters of a text node's value were written escaped in the source: as a backslash
 * escape (`\>`) or a character reference (`&gt;`). Read by walking the node's source alongside its
 * value; characters the value drops (a line's indent or `>` prefix) are skipped. `undefined`
 * without a position.
 */
function literalChars(node: Text, source: string): boolean[] | undefined {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return undefined;
  const raw = source.slice(start, end);
  const value = node.value;
  if (raw === value) return undefined;
  const literal = new Array<boolean>(value.length).fill(false);
  let i = 0;
  for (let j = 0; j < value.length && i < raw.length;) {
    const char = raw[i]!;
    if (char === "\\" && i + 1 < raw.length && ASCII_PUNCTUATION.test(raw[i + 1]!)) {
      if (value[j] === raw[i + 1]) {
        literal[j] = true;
        i += 2;
        j += 1;
        continue;
      }
    }
    if (char === "&" && value[j] !== "&") {
      const reference = CHARACTER_REFERENCE.exec(raw.slice(i));
      if (reference) {
        literal[j] = true;
        i += reference[0].length;
        j += 1;
        continue;
      }
    }
    if (char === value[j]) j += 1;
    i += 1;
  }
  return literal;
}
