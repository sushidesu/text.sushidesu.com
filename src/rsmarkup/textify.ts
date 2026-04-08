import { parse } from "./parse";
import type { Block, Inline } from "./types";

const inlineToText = (nodes: Inline[]): string =>
  nodes
    .map((n) => {
      switch (n.type) {
        case "text":
          return n.value;
        case "lineBreak":
          return " ";
        case "link":
          return n.label;
        case "inlineCode":
          return n.value;
      }
    })
    .join("");

const blockToText = (block: Block): string => {
  switch (block.type) {
    case "paragraph":
      return inlineToText(block.children);
    case "heading":
      return inlineToText(block.children);
    case "list":
      return block.items.map((it) => inlineToText(it.children)).join(" ");
    case "code":
      return block.content;
  }
};

export const excerpt = (source: string, maxLength = 140): string => {
  const text = source ? parse(source).children.map(blockToText).join(" ") : "";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
};
