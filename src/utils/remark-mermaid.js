import { visit } from "unist-util-visit";

/**
 * remark plugin that converts ```mermaid code blocks into raw HTML
 * `<pre class="mermaid">…</pre>` BEFORE Shiki runs.
 *
 * Why: Shiki has no `mermaid` grammar and would otherwise either fall back
 * to plain text highlighting or strip the language hint. By replacing the
 * mdast `code` node with an `html` node, Shiki ignores it entirely and the
 * client-side mermaid script (see Layout.astro) can render it.
 */
export function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.lang !== "mermaid") return;
      const source = node.value ?? "";
      // Only escape characters that would break out of <pre> or the attribute.
      // We intentionally do NOT escape `>` because mermaid syntax relies on
      // `-->`, `==>`, etc., and some mermaid versions choke when the textContent
      // is reconstituted from HTML entities (timing/whitespace edge cases).
      const inner = source.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const attr = inner.replace(/"/g, "&quot;").replace(/\n/g, "&#10;");
      parent.children[index] = {
        type: "html",
        value: `<pre class="mermaid" data-source="${attr}">${inner}</pre>`,
      };
    });
  };
}
