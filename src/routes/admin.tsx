import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { nanoid } from "nanoid/non-secure";
import { z } from "zod";
import { type AppBindings, database } from "../db/client";
import { post as postTable } from "../db/schema";
import { PostPage } from "../ui/post-page";

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

type PostFormValue = {
  title: string;
  slug: string;
  body: string;
  publishedAt: Date | null;
};

const POST_FORM_ID = "post-form";
const DELETE_FORM_ID = "delete-form";

const PostEditor: FC<{
  post: PostFormValue;
  error?: Record<string, string[] | undefined>;
}> = ({ post }) => {
  const hasSlug = post.slug !== "";
  return (
    <div class={adminPage}>
      <header class={adminHeader}>
        <div class={adminHeaderInner}>
          <a href={"/admin/posts"} class={backLink}>
            ← Back to posts
          </a>
          <div class={actionGroup}>
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
            {hasSlug && (
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

        {hasSlug && (
          <form
            id={DELETE_FORM_ID}
            method={"POST"}
            action={`/admin/posts/${post.slug}/delete`}
          />
        )}
      </main>
    </div>
  );
};

const formatDatetimeLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const emptyPost = (): PostFormValue => ({
  title: "",
  slug: "",
  body: "",
  publishedAt: null,
});

export const adminRoutes = new Hono<{ Bindings: AppBindings }>();

adminRoutes.get("/posts", async (c) => {
  const db = database(c.env.DB);
  const posts = await db
    .select()
    .from(postTable)
    .orderBy(
      sql`case when ${postTable.publishedAt} is null then 0 else 1 end`,
      desc(postTable.createdAt),
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
          <a href={"/admin/posts/new"} class={publishButton}>
            New post
          </a>
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
          {posts.map((p) => (
            <li
              key={p.slug}
              class={css`
                border-bottom: 1px solid #e5e7eb;
              `}
            >
              <a
                href={`/admin/posts/${p.slug}`}
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
                <span>{p.title}</span>
                {p.publishedAt ? (
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

adminRoutes.post("/posts/preview", async (c) => {
  const formData = await c.req.formData();
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "");
  const publishedAtStr = String(formData.get("publishedAt") ?? "");
  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : null;

  return c.render(<PostPage post={{ title, slug, body, publishedAt }} />, {
    title: `[preview] ${title || "untitled"} | text.sushidesu.com`,
  });
});

adminRoutes.get("/posts/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = database(c.env.DB);
  const [p] = await db.select().from(postTable).where(eq(postTable.slug, slug));

  if (!p) {
    return c.render(<PostEditor post={emptyPost()} />);
  }

  return c.render(
    <PostEditor
      post={{
        title: p.title,
        slug: p.slug,
        body: p.body,
        publishedAt: p.publishedAt,
      }}
    />,
  );
});

adminRoutes.post(
  "/posts/:slug",
  zValidator(
    "form",
    z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      body: z.string(),
      publishedAt: z.string().optional(),
    }),
    (result, c) => {
      if (!result.success) {
        return c.render(
          <PostEditor
            post={{
              title: result.data.title,
              slug: result.data.slug,
              body: result.data.body,
              publishedAt: result.data.publishedAt
                ? new Date(result.data.publishedAt)
                : null,
            }}
            error={result.error.flatten().fieldErrors}
          />,
        );
      }
    },
  ),
  async (c) => {
    const currentSlug = c.req.param("slug");
    const {
      title,
      slug,
      body,
      publishedAt: publishedAtStr,
    } = c.req.valid("form");
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : null;

    const db = database(c.env.DB);
    const [p] = await db
      .select()
      .from(postTable)
      .where(eq(postTable.slug, currentSlug));

    if (!p) {
      await db.insert(postTable).values({
        id: nanoid(),
        title,
        body,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt,
      });
    } else {
      await db
        .update(postTable)
        .set({
          title,
          body,
          slug,
          updatedAt: new Date(),
          publishedAt,
        })
        .where(eq(postTable.slug, currentSlug));
    }

    return c.redirect(`/admin/posts/${slug}`, 303);
  },
);

adminRoutes.post("/posts/:slug/delete", async (c) => {
  const slug = c.req.param("slug");
  const db = database(c.env.DB);
  await db.delete(postTable).where(eq(postTable.slug, slug));

  return c.render(
    <div>
      <p>Deleted {slug}</p>
      <a href={"/admin/posts"}>return to posts</a>
    </div>,
  );
});
