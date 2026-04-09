import type {
  Block,
  CodeBlock,
  Document,
  Heading,
  Image,
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
          return `<a href="${escapeHtml(
            n.url,
          )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            n.label,
          )}</a>`;
        case "inlineCode":
          return `<code>${escapeHtml(n.value)}</code>`;
        case "inlineImage": {
          const widthAttr = n.width !== undefined ? ` width="${n.width}"` : "";
          const heightAttr =
            n.height !== undefined ? ` height="${n.height}"` : "";
          const srcsetAttr = n.srcset
            ? ` srcset="${escapeHtml(n.srcset)}"`
            : "";
          const styleAttr = n.options.displayWidth
            ? ` style="max-width:${escapeHtml(
                n.options.displayWidth,
              )};height:auto"`
            : "";
          return `<img src="${escapeHtml(
            n.src,
          )}"${srcsetAttr} alt="${escapeHtml(
            n.alt,
          )}"${widthAttr}${heightAttr}${styleAttr} loading="lazy">`;
        }
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

const renderImage = (img: Image): string => {
  const widthAttr = img.width !== undefined ? ` width="${img.width}"` : "";
  const heightAttr = img.height !== undefined ? ` height="${img.height}"` : "";
  const srcsetAttr = img.srcset ? ` srcset="${escapeHtml(img.srcset)}"` : "";
  const styleAttr = img.options.displayWidth
    ? ` style="max-width:${escapeHtml(img.options.displayWidth)};height:auto"`
    : "";
  const imgTag = `<img src="${escapeHtml(
    img.src,
  )}"${srcsetAttr} alt="${escapeHtml(
    img.alt,
  )}"${widthAttr}${heightAttr}${styleAttr} loading="lazy">`;
  const figcaption =
    img.caption.length > 0
      ? `<figcaption>${renderInline(img.caption)}</figcaption>`
      : "";
  return `<figure>${imgTag}${figcaption}</figure>`;
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
    case "image":
      return renderImage(b);
  }
};

export const render = (doc: Document): string =>
  doc.children.map(renderBlock).join("");
