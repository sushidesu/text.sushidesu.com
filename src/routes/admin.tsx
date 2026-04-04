import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { nanoid } from "nanoid/non-secure";
import { z } from "zod";
import { type AppBindings, database } from "../db/client";
import { post as postTable } from "../db/schema";

const formControl = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-y-sm);
`;

const textInput = css`
  padding: var(--space-y-sm) var(--space-x-sm);
`;

type PostFormValue = {
  title: string;
  slug: string;
  body: string;
  publishedAt: Date | null;
};

const PostEditor: FC<{
  post: PostFormValue;
  error?: Record<string, string[] | undefined>;
}> = ({ post }) => {
  return (
    <div
      class={css`
        padding: var(--space-y-md) var(--space-x-md);
      `}
    >
      <a href={"/admin/posts"}>back to posts</a>
      <form
        method={"POST"}
        class={css`
          display: flex;
          flex-direction: column;
          gap: var(--space-y-md);
        `}
      >
        <div class={formControl}>
          <label>title</label>
          <input class={textInput} name={"title"} value={post.title} />
        </div>
        <div class={formControl}>
          <label>slug</label>
          <input class={textInput} name={"slug"} value={post.slug} />
        </div>
        <div class={formControl}>
          <label>body</label>
          <textarea class={textInput} name={"body"} rows={10}>
            {post.body}
          </textarea>
        </div>
        <div class={formControl}>
          <label>publishedAt (empty = unpublished)</label>
          <input
            class={textInput}
            name={"publishedAt"}
            type={"datetime-local"}
            value={
              post.publishedAt
                ? formatDatetimeLocal(post.publishedAt)
                : undefined
            }
          />
        </div>
        <div>
          <button type={"submit"}>POST</button>
        </div>
      </form>

      <hr />

      <form method={"POST"} action={`/admin/posts/${post.slug}/delete`}>
        <button type={"submit"}>DELETE</button>
      </form>
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
    <div
      class={css`
        padding: var(--space-y-md) var(--space-x-md);
      `}
    >
      <h1>Hello Admin</h1>
      <div
        class={css`
          display: flex;
          flex-direction: column;
          gap: var(--space-y-md);
        `}
      >
        <a href={"/admin/posts/new"}>Create New</a>
        <ul
          class={css`
            display: flex;
            flex-direction: column;
            gap: var(--space-y-sm);
          `}
        >
          {posts.map((p) => (
            <li
              key={p.slug}
              class={css`
                display: flex;
                flex-direction: row;
                gap: var(--space-x-sm);
              `}
            >
              <a href={`/admin/posts/${p.slug}`}>{p.title}</a>
              {p.publishedAt && <p>PUBLISHED</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>,
  );
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
