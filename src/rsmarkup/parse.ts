import type { Block, Document, Heading, Inline, ListItem } from "./types";

const INLINE_TYPES = new Set(["@", "!"]);
const BLOCK_LIST_OPEN = "\\-";
const BLOCK_CLOSE = "\\";
const BLOCK_CODE_RE = /^\\!(?: (.*))?$/;
const HEADING_LINE_RE = /^\\([1-6]) (.+) \\$/;

export const parse = (source: string): Document => {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line === "") {
      i++;
      continue;
    }

    if (line === BLOCK_LIST_OPEN) {
      i++;
      const items: ListItem[] = [];
      while (i < lines.length && lines[i] !== BLOCK_CLOSE) {
        const l = lines[i] ?? "";
        if (l !== "") {
          items.push({ type: "listItem", children: parseInline(l) });
        }
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: "list", items });
      continue;
    }

    const codeMatch = !line.includes(" \\") ? line.match(BLOCK_CODE_RE) : null;
    if (codeMatch) {
      const lang = codeMatch[1] ?? "";
      i++;
      const contentLines: string[] = [];
      while (i < lines.length && lines[i] !== BLOCK_CLOSE) {
        contentLines.push(lines[i] ?? "");
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({
        type: "code",
        lang,
        content: contentLines.join("\n"),
      });
      continue;
    }

    const hm = line.match(HEADING_LINE_RE);
    if (hm) {
      const level = Number(hm[1]) as Heading["level"];
      blocks.push({
        type: "heading",
        level,
        children: parseInline(hm[2] ?? ""),
      });
      i++;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i] ?? "";
      if (l === "") break;
      if (l === BLOCK_LIST_OPEN) break;
      if (!l.includes(" \\") && BLOCK_CODE_RE.test(l)) break;
      if (HEADING_LINE_RE.test(l)) break;
      paraLines.push(l);
      i++;
    }
    const children: Inline[] = [];
    paraLines.forEach((pl, idx) => {
      if (idx > 0) children.push({ type: "lineBreak" });
      children.push(...parseInline(pl));
    });
    blocks.push({ type: "paragraph", children });
  }

  return { type: "document", children: blocks };
};

const parseInline = (s: string): Inline[] => {
  const result: Inline[] = [];
  let buf = "";
  let i = 0;

  const flushBuf = () => {
    if (buf !== "") {
      result.push({ type: "text", value: buf });
      buf = "";
    }
  };

  while (i < s.length) {
    const c = s[i];
    const next = s[i + 1];
    if (
      c === "\\" &&
      next !== undefined &&
      INLINE_TYPES.has(next) &&
      s[i + 2] === " "
    ) {
      const typeChar = next;
      const closeIdx = findClose(s, i + 3);
      if (closeIdx !== -1) {
        const content = s.slice(i + 3, closeIdx);
        if (content !== "") {
          if (typeChar === "@") {
            const spaceIdx = content.indexOf(" ");
            const url = spaceIdx === -1 ? content : content.slice(0, spaceIdx);
            const label = spaceIdx === -1 ? url : content.slice(spaceIdx + 1);
            flushBuf();
            result.push({
              type: "link",
              url,
              label: label === "" ? url : label,
            });
            i = closeIdx + 2;
            continue;
          }
          if (typeChar === "!") {
            flushBuf();
            result.push({ type: "inlineCode", value: content });
            i = closeIdx + 2;
            continue;
          }
        }
      }
    }
    buf += c;
    i++;
  }
  flushBuf();
  return result;
};

const findClose = (s: string, from: number): number => {
  for (let j = from; j < s.length - 1; j++) {
    if (s[j] === " " && s[j + 1] === "\\") {
      return j;
    }
  }
  return -1;
};
