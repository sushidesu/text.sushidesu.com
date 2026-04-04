import { zValidator } from "@hono/zod-validator";
import { css } from "hono/css";
import { createRoute } from "honox/factory";
import { nanoid } from "nanoid/non-secure";
import { z } from "zod";
import * as schema from "../../../../db/schema";

import { eq } from "drizzle-orm";
import type { FC } from "hono/jsx";
import { database } from "../../../../db/client";

const formControl = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-y-sm);
`;

const textInput = css`
  padding: var(--space-y-sm) var(--space-x-sm);
`;

type Post = {
  title: string;
  slug: string;
  body: string;
  createdAt: Date;
  publishedAt: Date | null;
};

const Page: FC<{ post: Post; error?: Record<string, string[] | undefined> }> =
  ({ post }) => {
    return (
      <div
        class={css`
          padding: var(--space-y-md) var(--space-x-md);
        `}
      >
        <a href={"/admin/posts"}>← back to posts</a>
        <form
          method={"POST"}
          class={css`
            margin-top: var(--space-y-lg);
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
            <label>published at</label>
            <input
              name={"publishedAt"}
              type={"date"}
              value={
                post.publishedAt
                  ? post.publishedAt.toISOString().split("T")[0]
                  : undefined
              }
            />
          </div>
          <div>
            <button type={"submit"}>SAVE</button>
          </div>
        </form>

        <hr
          class={css`
            margin: var(--space-y-md) 0;
          `}
        />

        <form method={"POST"} action={`/admin/posts/${post.slug}/delete`}>
          <button type={"submit"}>DELETE</button>
        </form>
      </div>
    );
  };

export default createRoute(async (c) => {
  const { slug } = c.req.param();
  if (!slug) {
    return c.notFound();
  }

  const db = database(c.env);
  const [p] = await db
    .select()
    .from(schema.post)
    .where(eq(schema.post.slug, slug));

  if (!p) {
    return c.render(
      <Page
        post={{
          title: "",
          slug: "",
          body: "",
          createdAt: new Date(),
          publishedAt: null,
        }}
      />,
    );
  }

  return c.render(
    <Page
      post={{
        title: p.title,
        slug: p.slug,
        body: p.body,
        createdAt: p.createdAt,
        publishedAt: p.publishedAt,
      }}
    />,
  );
});

export const POST = createRoute(
  zValidator(
    "form",
    z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      body: z.string(),
      publishedAt: z.string(),
    }),
    (result, c) => {
      if (!result.success) {
        return c.render(
          <Page
            post={{
              title: result.data.title,
              slug: result.data.slug,
              body: result.data.body,
              createdAt: new Date(),
              publishedAt: null,
            }}
            error={result.error.flatten().fieldErrors}
          />,
        );
      }
    },
  ),
  async (c) => {
    const { slug: currentSlug } = c.req.param();
    const values = c.req.valid("form");

    const publishedAt =
      values.publishedAt !== "" ? new Date(values.publishedAt) : null;

    const db = database(c.env);
    // await db.transaction(async (tx) => {
    const [p] = await db
      .select()
      .from(schema.post)
      .where(eq(schema.post.slug, currentSlug));
    if (!p) {
      // create new post
      await db.insert(schema.post).values({
        id: nanoid(),
        title: values.title,
        body: values.body,
        slug: values.slug,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt,
      });
    } else {
      // update post
      await db
        .update(schema.post)
        .set({
          title: values.title,
          body: values.body,
          slug: values.slug,
          updatedAt: new Date(),
          publishedAt,
        })
        .where(eq(schema.post.slug, currentSlug));
    }
    // });

    return c.redirect(`/admin/posts/${values.slug}`, 303);
  },
);
