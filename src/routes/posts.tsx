import { and, eq, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { type AppBindings, database } from "../db/client";
import { post } from "../db/schema";
import { Header } from "../ui/header";
import { Layout } from "../ui/layout";

const Page: FC<{
  post: {
    title: string;
    slug: string;
    body: string;
    publishedAt: Date | null;
  };
}> = ({ post }) => {
  return (
    <Layout header={<Header />}>
      <div
        class={css`
          padding: var(--space-y-md) var(--space-x-md);
        `}
      >
        <h1
          class={css`
            font-size: 1.2rem;
            font-weight: bold;
          `}
        >
          {post.title}
        </h1>
        <p
          class={css`
            margin-top: var(--space-y-sm);
          `}
        >
          {post.publishedAt && (
            <time datetime={post.publishedAt.toISOString()}>
              {new Intl.DateTimeFormat("ja-JP").format(post.publishedAt)}
            </time>
          )}
        </p>
        <p
          class={css`
            margin-top: var(--space-y-lg);
            white-space: pre-wrap;
          `}
        >
          {post.body}
        </p>
      </div>
    </Layout>
  );
};

export const postsRoutes = new Hono<{ Bindings: AppBindings }>();

postsRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = database(c.env.DB);
  const [p] = await db
    .select()
    .from(post)
    .where(and(eq(post.slug, slug), isNotNull(post.publishedAt)));

  if (!p) {
    return c.notFound();
  }

  return c.render(
    <Page
      post={{
        title: p.title,
        slug: p.slug,
        body: p.body,
        publishedAt: p.publishedAt,
      }}
    />,
    {
      title: `${p.title} | text.sushidesu.com`,
    },
  );
});
