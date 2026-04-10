import { desc, eq, like, or } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import { raw } from "hono/html";
import { nanoid } from "nanoid/non-secure";
import { type AppBindings, database } from "../db/client";
import {
  draft as draftTable,
  image as imageTable,
  post as postTable,
} from "../db/schema";
import { imagesClientScript } from "./images.client";

export const imagesRoutes = new Hono<{ Bindings: AppBindings }>();

const page = css`
  min-height: 100vh;
  background: #ffffff;
  color: #111827;
`;

const header = css`
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
`;

const headerInner = css`
  max-width: 56rem;
  margin: 0 auto;
  padding: 0 1rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const backLink = css`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  &:hover { color: #111827; }
`;

const main = css`
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const dropZone = css`
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  &.dragover {
    border-color: #111827;
    background: #f9fafb;
  }
`;

const grid = css`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
`;

const tile = css`
  position: relative;
  aspect-ratio: 1;
  background: #f3f4f6;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// ----- HTML page -----

imagesRoutes.get("/", async (c) => {
  const baseUrl = c.env.ASSET_BASE_URL;
  return c.render(
    <div class={page}>
      <header class={header}>
        <div class={headerInner}>
          <a href={"/admin/posts"} class={backLink}>
            ← Back to posts
          </a>
          <span class={css`font-size: 0.875rem; font-weight: 600;`}>
            Images
          </span>
        </div>
      </header>
      <main class={main}>
        <div id="drop-zone" class={dropZone}>
          ここに画像をドロップ / クリックして選択
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            style="display:none"
          />
        </div>
        <div id="preview-area" />
        <div id="gallery" class={grid} />
        <script>
          {raw(`window.__ASSET_BASE_URL__ = ${JSON.stringify(baseUrl)};`)}
        </script>
        <script type="module">{raw(imagesClientScript)}</script>
      </main>
    </div>,
  );
});

// ----- JSON list -----

imagesRoutes.get("/data", async (c) => {
  const db = database(c.env.DB);
  const limit = Math.min(Number(c.req.query("limit") ?? 100), 200);
  const offset = Number(c.req.query("offset") ?? 0);
  const rows = await db
    .select()
    .from(imageTable)
    .orderBy(desc(imageTable.createdAt))
    .limit(limit)
    .offset(offset);
  return c.json({
    images: rows.map((r) => ({
      id: r.id,
      key: r.key,
      key2x: r.key2x,
      width: r.width,
      height: r.height,
      size: r.size,
      mimeType: r.mimeType,
      originalFilename: r.originalFilename,
      createdAt: r.createdAt.getTime(),
    })),
  });
});

// ----- Upload -----

const parseUploadForm = async (req: Request) => {
  const form = await req.formData();
  const file = form.get("file");
  const file2x = form.get("file2x");
  const width = Number(form.get("width") ?? 0);
  const height = Number(form.get("height") ?? 0);
  const originalFilename = form.get("originalFilename");
  if (!(file instanceof File) || width <= 0 || height <= 0) {
    return null;
  }
  return {
    file,
    file2x: file2x instanceof File ? file2x : null,
    width,
    height,
    originalFilename:
      typeof originalFilename === "string" ? originalFilename : null,
  };
};

imagesRoutes.post("/", async (c) => {
  const parsed = await parseUploadForm(c.req.raw);
  if (!parsed) return c.json({ error: "invalid" }, 400);

  const id = nanoid(12);
  const key = `${id}.webp`;
  const key2x = parsed.file2x ? `${id}@2x.webp` : null;

  await c.env.ASSETS.put(key, await parsed.file.arrayBuffer(), {
    httpMetadata: { contentType: "image/webp" },
  });
  if (parsed.file2x && key2x) {
    await c.env.ASSETS.put(key2x, await parsed.file2x.arrayBuffer(), {
      httpMetadata: { contentType: "image/webp" },
    });
  }

  const db = database(c.env.DB);
  await db.insert(imageTable).values({
    id,
    key,
    key2x,
    mimeType: "image/webp",
    width: parsed.width,
    height: parsed.height,
    size: parsed.file.size,
    originalFilename: parsed.originalFilename,
    createdAt: new Date(),
  });

  return c.json({ id, key, key2x });
});

// ----- Re-edit (in-place) -----

imagesRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = await parseUploadForm(c.req.raw);
  if (!parsed) return c.json({ error: "invalid" }, 400);

  const db = database(c.env.DB);
  const [existing] = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.id, id));
  if (!existing) return c.json({ error: "not found" }, 404);

  const newSuffix = nanoid(6);
  const newKey = `${id}-${newSuffix}.webp`;
  const newKey2x = parsed.file2x ? `${id}-${newSuffix}@2x.webp` : null;

  await c.env.ASSETS.put(newKey, await parsed.file.arrayBuffer(), {
    httpMetadata: { contentType: "image/webp" },
  });
  if (parsed.file2x && newKey2x) {
    await c.env.ASSETS.put(newKey2x, await parsed.file2x.arrayBuffer(), {
      httpMetadata: { contentType: "image/webp" },
    });
  }

  await db
    .update(imageTable)
    .set({
      key: newKey,
      key2x: newKey2x,
      width: parsed.width,
      height: parsed.height,
      size: parsed.file.size,
    })
    .where(eq(imageTable.id, id));

  // best-effort old object cleanup
  try {
    await c.env.ASSETS.delete(existing.key);
    if (existing.key2x) await c.env.ASSETS.delete(existing.key2x);
  } catch {}

  return c.json({ id, key: newKey, key2x: newKey2x });
});

// ----- Delete (with reference check) -----

imagesRoutes.get("/:id/references", async (c) => {
  const id = c.req.param("id");
  const db = database(c.env.DB);
  const pattern = `%\\i ${id}%`;
  // Search both published posts and drafts
  const postRefs = await db
    .select({ slug: postTable.slug, title: postTable.title })
    .from(postTable)
    .where(like(postTable.body, pattern));
  const draftRefs = await db
    .select({ slug: draftTable.slug, title: draftTable.title })
    .from(draftTable)
    .where(like(draftTable.body, pattern));
  // Deduplicate by title
  const seen = new Set(postRefs.map((r) => r.title));
  const combined = [
    ...postRefs,
    ...draftRefs.filter((r) => !seen.has(r.title)),
  ];
  return c.json({ references: combined });
});

imagesRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = database(c.env.DB);
  const [existing] = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.id, id));
  if (!existing) return c.json({ error: "not found" }, 404);

  await db.delete(imageTable).where(eq(imageTable.id, id));
  try {
    await c.env.ASSETS.delete(existing.key);
    if (existing.key2x) await c.env.ASSETS.delete(existing.key2x);
  } catch {}

  return c.json({ ok: true });
});
