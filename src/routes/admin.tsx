import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
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
  createdAt: Date;
  isPublished: boolean;
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
        <div>
          <label>publish</label>
          <input
            name={"isPublished"}
            type={"checkbox"}
            checked={post.isPublished}
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

const emptyPost = (): PostFormValue => ({
  title: "",
  slug: "",
  body: "",
  createdAt: new Date(),
  isPublished: false,
});

export const adminRoutes = new Hono<{ Bindings: AppBindings }>();

adminRoutes.get("/posts", async (c) => {
  const db = database(c.env.DB);
  const posts = await db.select().from(postTable);

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
        createdAt: p.createdAt,
        isPublished: p.publishedAt !== null,
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
      isPublished: z.literal("on").optional(),
    }),
    (result, c) => {
      if (!result.success) {
        return c.render(
          <PostEditor
            post={{
              title: result.data.title,
              slug: result.data.slug,
              body: result.data.body,
              createdAt: new Date(),
              isPublished: result.data.isPublished === "on",
            }}
            error={result.error.flatten().fieldErrors}
          />,
        );
      }
    },
  ),
  async (c) => {
    const currentSlug = c.req.param("slug");
    const { title, slug, body, isPublished } = c.req.valid("form");

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
        publishedAt: isPublished ? new Date() : null,
      });
    } else {
      await db
        .update(postTable)
        .set({
          title,
          body,
          slug,
          updatedAt: new Date(),
          publishedAt: isPublished ? new Date() : null,
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
