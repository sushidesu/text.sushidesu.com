import { inArray } from "drizzle-orm";
import type { DB } from "../db/client";
import { image as imageTable } from "../db/schema";
import type {
  Block,
  Document,
  Image,
  Inline,
  InlineImage,
} from "../rsmarkup/types";

type ImageRow = typeof imageTable.$inferSelect;

const collectImageIds = (doc: Document): string[] => {
  const ids = new Set<string>();
  const walkInlines = (nodes: Inline[]) => {
    for (const n of nodes) {
      if (n.type === "inlineImage") ids.add(n.src);
    }
  };
  for (const b of doc.children) {
    if (b.type === "image") ids.add(b.src);
    if (b.type === "paragraph" || b.type === "heading") walkInlines(b.children);
    if (b.type === "list")
      for (const item of b.items) walkInlines(item.children);
    if (b.type === "image") walkInlines(b.caption);
  }
  return [...ids];
};

const missingPlaceholder = (): Block => ({
  type: "paragraph",
  children: [{ type: "text", value: "[画像が見つかりません]" }],
});

const resolveInline = (
  node: Inline,
  map: Map<string, ImageRow>,
  assetBaseUrl: string,
): Inline => {
  if (node.type !== "inlineImage") return node;
  const found = map.get(node.src);
  if (!found) return { type: "text", value: "[画像が見つかりません]" };
  const src1x = `${assetBaseUrl}/${found.key}`;
  const srcset = found.key2x
    ? `${src1x} 1x, ${assetBaseUrl}/${found.key2x} 2x`
    : undefined;
  const next: InlineImage = {
    type: "inlineImage",
    src: src1x,
    alt: node.alt,
    options: node.options,
    srcset,
    width: found.width,
    height: found.height,
  };
  return next;
};

const resolveInlines = (
  nodes: Inline[],
  map: Map<string, ImageRow>,
  assetBaseUrl: string,
): Inline[] => nodes.map((n) => resolveInline(n, map, assetBaseUrl));

export const resolveImages = async (
  doc: Document,
  db: DB,
  assetBaseUrl: string,
): Promise<Document> => {
  const ids = collectImageIds(doc);
  if (ids.length === 0) return doc;

  const rows = await db
    .select()
    .from(imageTable)
    .where(inArray(imageTable.id, ids));
  const map = new Map(rows.map((r) => [r.id, r]));

  const children: Block[] = doc.children.map((b) => {
    switch (b.type) {
      case "image": {
        const found = map.get(b.src);
        if (!found) return missingPlaceholder();
        const src1x = `${assetBaseUrl}/${found.key}`;
        const srcset = found.key2x
          ? `${src1x} 1x, ${assetBaseUrl}/${found.key2x} 2x`
          : undefined;
        const next: Image = {
          type: "image",
          src: src1x,
          alt: b.alt,
          options: b.options,
          srcset,
          width: found.width,
          height: found.height,
          caption: resolveInlines(b.caption, map, assetBaseUrl),
        };
        return next;
      }
      case "paragraph":
        return {
          ...b,
          children: resolveInlines(b.children, map, assetBaseUrl),
        };
      case "heading":
        return {
          ...b,
          children: resolveInlines(b.children, map, assetBaseUrl),
        };
      case "list":
        return {
          ...b,
          items: b.items.map((item) => ({
            ...item,
            children: resolveInlines(item.children, map, assetBaseUrl),
          })),
        };
      case "code":
        return b;
    }
  });

  return { type: "document", children };
};
