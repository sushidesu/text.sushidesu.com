import type { Block, Document, Heading, Inline, ListItem } from "./types";

const HEADING_LINE_RE = /^\\ ([1-6]) (.+) \\$/;

export const parse = (source: string): Document => {
  const lines = source.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line === "") {
      i++;
      continue;
    }

    if (line === "\\-") {
      i++;
      const items: ListItem[] = [];
      while (i < lines.length && lines[i] !== "\\") {
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

    if (line.startsWith("\\!")) {
      const lang = line.slice(2);
      i++;
      const contentLines: string[] = [];
      while (i < lines.length && lines[i] !== "\\") {
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
      if (l === "\\-") break;
      if (l.startsWith("\\!")) break;
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
    if (s[i] === "\\" && s[i + 1] === " ") {
      const closeIdx = findClose(s, i + 2);
      if (closeIdx === -1) {
        buf += s[i];
        i++;
        continue;
      }
      const content = s.slice(i + 2, closeIdx);
      if (content === "") {
        buf += s[i];
        i++;
        continue;
      }
      const spaceIdx = content.indexOf(" ");
      const firstToken = spaceIdx === -1 ? content : content.slice(0, spaceIdx);
      const rest = spaceIdx === -1 ? "" : content.slice(spaceIdx + 1);

      if (
        firstToken.startsWith("http://") ||
        firstToken.startsWith("https://")
      ) {
        flushBuf();
        result.push({
          type: "link",
          url: firstToken,
          label: rest === "" ? firstToken : rest,
        });
        i = closeIdx + 2;
        continue;
      }

      buf += s.slice(i, closeIdx + 2);
      i = closeIdx + 2;
      continue;
    }
    buf += s[i];
    i++;
  }
  flushBuf();
  return result;
};

// Find the index of " \" (space + backslash) in s starting at `from`.
const findClose = (s: string, from: number): number => {
  for (let j = from; j < s.length - 1; j++) {
    if (s[j] === " " && s[j + 1] === "\\") {
      return j;
    }
  }
  return -1;
};
