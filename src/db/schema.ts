import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const image = sqliteTable(
  "image",
  {
    id: text("image_id").primaryKey(),
    key: text("key").notNull().unique(),
    key2x: text("key_2x"),
    mimeType: text("mime_type").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    size: integer("size").notNull(),
    originalFilename: text("original_filename"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    createdAtIdx: index("image_created_at_idx").on(t.createdAt),
  }),
);

export const post = sqliteTable("post", {
  id: text("post_id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  slug: text("slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
});

export const draft = sqliteTable("draft", {
  id: text("draft_id").primaryKey(),
  postId: text("post_id").references(() => post.id),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  slug: text("slug").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
