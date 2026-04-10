import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import { nanoid } from "nanoid/non-secure";
import { z } from "zod";
import { type AppBindings, database } from "../db/client";
import { draft as draftTable, post as postTable } from "../db/schema";
import { renderPostBody } from "../post/render-body";
import { PostPage } from "../ui/post-page";
import { adminClientScript } from "./admin.client";

const adminPage = css`
  min-height: 100vh;
  background: #ffffff;
  color: #111827;
`;

const adminHeader = css`
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
`;

const adminHeaderInner = css`
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  &:hover {
    color: #111827;
  }
`;

const actionGroup = css`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const actionLink = css`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  text-decoration: none;
  &:hover {
    color: #111827;
  }
`;

const previewButton = css`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  &:hover {
    color: #111827;
  }
`;

const verticalDivider = css`
  width: 1px;
  height: 1rem;
  background: #d1d5db;
`;

const deleteButton = css`
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc2626;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  &:hover {
    color: #991b1b;
  }
`;

const publishButton = css`
  font-size: 0.875rem;
  font-weight: 500;
  background: #111827;
  color: #ffffff;
  padding: 0.5rem 1.25rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-family: inherit;
  &:hover {
    background: #1f2937;
  }
`;

const adminMain = css`
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const fieldGrid = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const fullColumn = css`
  grid-column: 1 / -1;
`;

const fieldLabel = css`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
`;

const textInput = css`
  display: block;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  background: #ffffff;
  color: inherit;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #111827;
    box-shadow: 0 0 0 1px #111827;
  }
`;

const textArea = css`
  display: block;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  background: #ffffff;
  color: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.625;
  resize: vertical;
  field-sizing: content;
  min-height: 60vh;
  &:focus {
    outline: none;
    border-color: #111827;
    box-shadow: 0 0 0 1px #111827;
  }
`;

const hintText = css`
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
`;

const bodySection = css`
  margin-top: 2rem;
`;

const saveStatus = css`
  font-size: 0.75rem;
  color: #9ca3af;
`;

type PostFormValue = {
  title: string;
  slug: string;
  body: string;
  publishedAt: Date | null;
};

const POST_FORM_ID = "post-form";
const DELETE_FORM_ID = "delete-form";

const PostEditor: FC<{
  draftId: string;
  post: PostFormValue;
  isExisting: boolean;
}> = ({ draftId, post, isExisting }) => {
  return (
    <div class={adminPage}>
      <header class={adminHeader}>
        <div class={adminHeaderInner}>
          <a href={"/admin/posts"} class={backLink}>
            ← Back to posts
          </a>
          <div class={actionGroup}>
            <span id={"save-status"} class={saveStatus} />
            <button
              type={"submit"}
              form={POST_FORM_ID}
              formaction={"/admin/posts/preview"}
              formmethod={"post"}
              formtarget={"_blank"}
              formnovalidate
              class={previewButton}
            >
              Preview
            </button>
            {isExisting && (
              <>
                <span class={verticalDivider} />
                <button
                  type={"submit"}
                  form={DELETE_FORM_ID}
                  class={deleteButton}
                >
                  Delete
                </button>
              </>
            )}
            <button type={"submit"} form={POST_FORM_ID} class={publishButton}>
              Save
            </button>
          </div>
        </div>
      </header>

      <main class={adminMain}>
        <form id={POST_FORM_ID} method={"POST"}>
          <input type={"hidden"} name={"draftId"} value={draftId} />
          <div class={fieldGrid}>
            <div class={fullColumn}>
              <label class={fieldLabel} for={"title"}>
                Title
              </label>
              <input
                id={"title"}
                class={textInput}
                name={"title"}
                value={post.title}
              />
            </div>
            <div>
              <label class={fieldLabel} for={"slug"}>
                Slug
              </label>
              <input
                id={"slug"}
                class={textInput}
                name={"slug"}
                value={post.slug}
              />
            </div>
            <div>
              <label class={fieldLabel} for={"publishedAt"}>
                Publish Date
              </label>
              <input
                id={"publishedAt"}
                class={textInput}
                name={"publishedAt"}
                type={"datetime-local"}
                value={
                  post.publishedAt
                    ? formatDatetimeLocal(post.publishedAt)
                    : undefined
                }
              />
              <p class={hintText}>Leave blank to keep as draft</p>
            </div>
          </div>

          <div class={bodySection}>
            <label class={fieldLabel} for={"body"}>
              Content
            </label>
            <textarea id={"body"} class={textArea} name={"body"} rows={20}>
              {post.body}
            </textarea>
          </div>
        </form>

        {isExisting && (
          <form
            id={DELETE_FORM_ID}
            method={"POST"}
            action={`/admin/posts/${draftId}/delete`}
          />
        )}
      </main>

      <script type="module">{raw(adminClientScript)}</script>
    </div>
  );
};

const formatDatetimeLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

export const adminRoutes = new Hono<{ Bindings: AppBindings }>();

// --- Post list ---
adminRoutes.get("/posts", async (c) => {
  const db = database(c.env.DB);
  // Left join draft with post to show all drafts and their publish status
  const rows = await db
    .select({
      draftId: draftTable.id,
      title: draftTable.title,
      slug: draftTable.slug,
      postId: draftTable.postId,
      publishedAt: postTable.publishedAt,
      createdAt: draftTable.createdAt,
    })
    .from(draftTable)
    .leftJoin(postTable, eq(draftTable.postId, postTable.id))
    .orderBy(
      sql`case when ${postTable.publishedAt} is null then 0 else 1 end`,
      desc(draftTable.createdAt),
    );

  return c.render(
    <div class={adminPage}>
      <header class={adminHeader}>
        <div class={adminHeaderInner}>
          <span
            class={css`
              font-size: 0.875rem;
              font-weight: 600;
              color: #111827;
            `}
          >
            Posts
          </span>
          <div class={actionGroup}>
            <a href={"/admin/images"} class={actionLink}>
              Images
            </a>
            <a href={"/admin/posts/new"} class={publishButton}>
              New post
            </a>
          </div>
        </div>
      </header>
      <main class={adminMain}>
        <ul
          class={css`
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            border-top: 1px solid #e5e7eb;
          `}
        >
          {rows.map((r) => (
            <li
              key={r.draftId}
              class={css`
                border-bottom: 1px solid #e5e7eb;
              `}
            >
              <a
                href={`/admin/posts/${r.draftId}`}
                class={css`
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 1rem;
                  padding: 0.875rem 0.25rem;
                  font-size: 0.875rem;
                  color: #111827;
                  text-decoration: none;
                  &:hover {
                    background: #f9fafb;
                  }
                `}
              >
                <span>{r.title || "(untitled)"}</span>
                {r.publishedAt ? (
                  <span
                    class={css`
                      font-size: 0.75rem;
                      color: #16a34a;
                      font-weight: 500;
                    `}
                  >
                    PUBLISHED
                  </span>
                ) : (
                  <span
                    class={css`
                      font-size: 0.75rem;
                      color: #9ca3af;
                      font-weight: 500;
                    `}
                  >
                    DRAFT
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>,
  );
});

// --- Preview ---
adminRoutes.post("/posts/preview", async (c) => {
  const formData = await c.req.formData();
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "");
  const publishedAtStr = String(formData.get("publishedAt") ?? "");
  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : null;

  const db = database(c.env.DB);
  const bodyHtml = await renderPostBody(body, db, c.env.ASSET_BASE_URL);

  return c.render(<PostPage post={{ title, slug, bodyHtml, publishedAt }} />, {
    title: `[preview] ${title || "untitled"} | text.sushidesu.com`,
  });
});

// --- New post (create draft) ---
adminRoutes.get("/posts/new", async (c) => {
  const draftId = nanoid();
  const db = database(c.env.DB);
  const now = new Date();
  await db.insert(draftTable).values({
    id: draftId,
    postId: null,
    title: "",
    body: "",
    slug: "",
    createdAt: now,
    updatedAt: now,
  });
  return c.redirect(`/admin/posts/${draftId}`, 303);
});

// --- Edit post (load draft) ---
adminRoutes.get("/posts/:draftId", async (c) => {
  const draftId = c.req.param("draftId");
  const db = database(c.env.DB);

  const [d] = await db
    .select({
      id: draftTable.id,
      postId: draftTable.postId,
      title: draftTable.title,
      body: draftTable.body,
      slug: draftTable.slug,
      publishedAt: postTable.publishedAt,
    })
    .from(draftTable)
    .leftJoin(postTable, eq(draftTable.postId, postTable.id))
    .where(eq(draftTable.id, draftId));

  if (!d) {
    return c.notFound();
  }

  return c.render(
    <PostEditor
      draftId={d.id}
      post={{
        title: d.title,
        slug: d.slug,
        body: d.body,
        publishedAt: d.publishedAt,
      }}
      isExisting={d.postId !== null}
    />,
  );
});

// --- Auto-save (update draft) ---
adminRoutes.post(
  "/posts/:draftId/autosave",
  zValidator(
    "json",
    z.object({
      title: z.string(),
      slug: z.string(),
      body: z.string(),
    }),
  ),
  async (c) => {
    const draftId = c.req.param("draftId");
    const { title, slug, body } = c.req.valid("json");
    const db = database(c.env.DB);

    await db
      .update(draftTable)
      .set({ title, slug, body, updatedAt: new Date() })
      .where(eq(draftTable.id, draftId));

    return c.json({ ok: true });
  },
);

// --- Save (publish / update) ---
adminRoutes.post(
  "/posts/:draftId",
  zValidator(
    "form",
    z.object({
      draftId: z.string(),
      title: z.string(),
      slug: z.string(),
      body: z.string(),
      publishedAt: z.string().optional(),
    }),
  ),
  async (c) => {
    const draftId = c.req.param("draftId");
    const {
      title,
      slug,
      body,
      publishedAt: publishedAtStr,
    } = c.req.valid("form");
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : null;
    const now = new Date();

    const db = database(c.env.DB);

    // Always update draft
    await db
      .update(draftTable)
      .set({ title, slug, body, updatedAt: now })
      .where(eq(draftTable.id, draftId));

    // Get draft to check if post exists
    const [d] = await db
      .select()
      .from(draftTable)
      .where(eq(draftTable.id, draftId));

    if (!d) {
      return c.notFound();
    }

    // Sync draft → post only when publishing
    if (!publishedAt) {
      return c.json({ ok: true, published: false });
    }

    // Validate for publish
    const errors: string[] = [];
    if (!title) errors.push("Title is required");
    if (!slug) errors.push("Slug is required");

    if (errors.length > 0) {
      return c.json({ ok: false, errors }, 400);
    }

    if (d.postId) {
      await db
        .update(postTable)
        .set({ title, body, slug, updatedAt: now, publishedAt })
        .where(eq(postTable.id, d.postId));
    } else {
      const postId = nanoid();
      await db.insert(postTable).values({
        id: postId,
        title,
        body,
        slug,
        createdAt: now,
        updatedAt: now,
        publishedAt,
      });
      await db
        .update(draftTable)
        .set({ postId })
        .where(eq(draftTable.id, draftId));
    }

    return c.json({ ok: true, published: true });
  },
);

// --- Delete ---
adminRoutes.post("/posts/:draftId/delete", async (c) => {
  const draftId = c.req.param("draftId");
  const db = database(c.env.DB);

  const [d] = await db
    .select()
    .from(draftTable)
    .where(eq(draftTable.id, draftId));

  if (d?.postId) {
    await db.delete(postTable).where(eq(postTable.id, d.postId));
  }
  await db.delete(draftTable).where(eq(draftTable.id, draftId));

  return c.render(
    <div>
      <p>Deleted</p>
      <a href={"/admin/posts"}>return to posts</a>
    </div>,
  );
});
