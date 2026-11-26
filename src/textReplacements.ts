import type { Root as MdastRoot, Nodes as MdastNodes } from "mdast";

/**
 * Replace text as written, such as `->` with `→`: Quartz 4's `parseArrows`, without a built-in
 * list. Only prose changes: code, inline code, math, HTML, URLs and link targets are not text
 * nodes. The longest match wins (`-->` before `->`).
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
  const walk = (node: MdastNodes) => {
    if (node.type === "text") {
      node.value = node.value.replace(pattern, (match) => replacements[match] ?? match);
      return;
    }
    if ("children" in node) for (const child of node.children) walk(child);
  };
  return (tree: MdastRoot) => walk(tree);
}
