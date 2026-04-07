import type {
  Block,
  CodeBlock,
  Document,
  Heading,
  Inline,
  List,
  Paragraph,
} from "./types";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInline = (nodes: Inline[]): string =>
  nodes
    .map((n) => {
      switch (n.type) {
        case "text":
          return escapeHtml(n.value);
        case "lineBreak":
          return "<br>";
        case "link":
          return `<a href="${escapeHtml(n.url)}">${escapeHtml(n.label)}</a>`;
        case "inlineCode":
          return `<code>${escapeHtml(n.value)}</code>`;
      }
    })
    .join("");

const renderParagraph = (p: Paragraph): string =>
  `<p>${renderInline(p.children)}</p>`;

const renderHeading = (h: Heading): string =>
  `<h${h.level}>${renderInline(h.children)}</h${h.level}>`;

const renderList = (l: List): string => {
  const items = l.items
    .map((it) => `<li>${renderInline(it.children)}</li>`)
    .join("");
  return `<ul>${items}</ul>`;
};

const renderCode = (c: CodeBlock): string => {
  const classAttr = c.lang ? ` class="language-${escapeHtml(c.lang)}"` : "";
  return `<pre><code${classAttr}>${escapeHtml(c.content)}</code></pre>`;
};

const renderBlock = (b: Block): string => {
  switch (b.type) {
    case "paragraph":
      return renderParagraph(b);
    case "heading":
      return renderHeading(b);
    case "list":
      return renderList(b);
    case "code":
      return renderCode(b);
  }
};

export const render = (doc: Document): string =>
  doc.children.map(renderBlock).join("");
