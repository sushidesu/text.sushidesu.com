import type {
  Block,
  Document,
  Heading,
  ImageOptions,
  Inline,
  ListItem,
} from "./types";

const INLINE_TYPES = new Set(["@", "!", "i"]);
const BLOCK_OPEN_RE = /^(\\+)([!\-i])(?: (.*))?$/;
const HEADING_LINE_RE = /^\\([1-6]) (.+) \\$/;

type BlockOpen = {
  fence: string;
  blockType: "!" | "-" | "i";
  param: string;
};

const matchBlockOpen = (line: string): BlockOpen | null => {
  if (line.includes(" \\")) return null;
  const m = line.match(BLOCK_OPEN_RE);
  if (!m) return null;
  const fence = m[1] ?? "";
  const blockType = m[2] as "!" | "-" | "i";
  const param = m[3];
  // List does not accept a parameter
  if (blockType === "-" && param !== undefined) return null;
  // Image requires a parameter (the src)
  if (blockType === "i" && (param === undefined || param === "")) return null;
  return { fence, blockType, param: param ?? "" };
};

const parseImageParams = (
  raw: string,
): { src: string; options: ImageOptions; alt: string } => {
  const tokens = raw.split(" ");
  const src = tokens[0] ?? "";
  const options: ImageOptions = {};
  const altParts: string[] = [];
  for (let j = 1; j < tokens.length; j++) {
    const t = tokens[j] ?? "";
    if (t.includes("=")) {
      const eqIdx = t.indexOf("=");
      const key = t.slice(0, eqIdx);
      const val = t.slice(eqIdx + 1);
      if (key === "w") options.displayWidth = val;
    } else {
      altParts.push(t);
    }
  }
  return { src, options, alt: altParts.join(" ") };
};

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

    const open = matchBlockOpen(line);
    if (open) {
      i++;
      const contentLines: string[] = [];
      while (i < lines.length && lines[i] !== open.fence) {
        contentLines.push(lines[i] ?? "");
        i++;
      }
      if (i < lines.length) i++;
      if (open.blockType === "!") {
        blocks.push({
          type: "code",
          lang: open.param,
          content: contentLines.join("\n"),
        });
      } else if (open.blockType === "i") {
        const params = parseImageParams(open.param);
        const captionLines: string[] = [];
        for (const l of contentLines) {
          if (l !== "") captionLines.push(l);
        }
        const caption: Inline[] = [];
        captionLines.forEach((cl, idx) => {
          if (idx > 0) caption.push({ type: "lineBreak" });
          caption.push(...parseInline(cl));
        });
        blocks.push({
          type: "image",
          src: params.src,
          alt: params.alt,
          options: params.options,
          caption,
        });
      } else {
        const items: ListItem[] = [];
        for (const l of contentLines) {
          if (l !== "") {
            items.push({ type: "listItem", children: parseInline(l) });
          }
        }
        blocks.push({ type: "list", items });
      }
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
      if (matchBlockOpen(l)) break;
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
    if (s[i] === "\\") {
      let n = 0;
      while (s[i + n] === "\\") n++;
      const typeChar = s[i + n];
      if (
        typeChar !== undefined &&
        INLINE_TYPES.has(typeChar) &&
        s[i + n + 1] === " "
      ) {
        const contentStart = i + n + 2;
        const closeIdx = findCloseN(s, contentStart, n);
        if (closeIdx !== -1) {
          const content = s.slice(contentStart, closeIdx);
          if (content !== "") {
            if (typeChar === "@") {
              const spaceIdx = content.indexOf(" ");
              const url =
                spaceIdx === -1 ? content : content.slice(0, spaceIdx);
              const label = spaceIdx === -1 ? url : content.slice(spaceIdx + 1);
              flushBuf();
              result.push({
                type: "link",
                url,
                label: label === "" ? url : label,
              });
              i = closeIdx + 1 + n;
              continue;
            }
            if (typeChar === "!") {
              flushBuf();
              result.push({ type: "inlineCode", value: content });
              i = closeIdx + 1 + n;
              continue;
            }
            if (typeChar === "i") {
              const params = parseImageParams(content);
              flushBuf();
              result.push({
                type: "inlineImage",
                src: params.src,
                alt: params.alt,
                options: params.options,
              });
              i = closeIdx + 1 + n;
              continue;
            }
          }
        }
      }
    }
    buf += s[i];
    i++;
  }
  flushBuf();
  return result;
};

// Find the index of " " followed by exactly n consecutive backslashes
// (the character after the n-th backslash is not another backslash).
const findCloseN = (s: string, from: number, n: number): number => {
  for (let j = from; j < s.length; j++) {
    if (s[j] !== " ") continue;
    let k = 0;
    while (s[j + 1 + k] === "\\") k++;
    if (k === n) return j;
  }
  return -1;
};
