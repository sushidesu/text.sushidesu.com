import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const post = sqliteTable("post", {
  id: text("post_id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  slug: text("slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
});
