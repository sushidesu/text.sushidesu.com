import { and, eq, isNotNull } from "drizzle-orm";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { createRoute } from "honox/factory";
import { database } from "../../db/client";
import * as schema from "../../db/schema";
import { formatDateTime } from "../../ui/datetime";
import { Header } from "../../ui/header";
import { Layout } from "../../ui/layout";

const Page: FC<{
  post: {
    title: string;
    slug: string;
    body: string;
    createdAt: Date;
    isPublished: boolean;
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
            line-height: 1.4;
            font-weight: bold;
          `}
        >
          {post.title}
        </h1>
        <p
          class={css`
            margin-top: var(--space-y-sm);
            font-family: var(--font-mono);
            font-size: var(--text-sm);
            color: var(--color-text-subdued);
          `}
        >
          <time datetime={post.createdAt.toISOString()}>
            {formatDateTime(post.createdAt)}
          </time>
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

export default createRoute(async (c) => {
  const { slug } = c.req.param();
  if (!slug) {
    return c.notFound();
  }
  const db = database(c.env);
  const [p] = await db
    .select()
    .from(schema.post)
    .where(and(eq(schema.post.slug, slug), isNotNull(schema.post.publishedAt)));

  if (!p) {
    return c.notFound();
  }

  return c.render(
    <Page
      post={{
        title: p.title,
        slug: p.slug,
        body: p.body,
        createdAt: p.createdAt,
        isPublished: p.publishedAt !== null,
      }}
    />,
    {
      title: `${p.title} | text.sushidesu.com`,
    },
  );
});
