import { desc, isNotNull } from "drizzle-orm";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { createRoute } from "honox/factory";
import { database } from "../db/client";
import { post } from "../db/schema";
import { formatDateTime } from "../ui/datetime";
import { Header } from "../ui/header";
import { Layout } from "../ui/layout";

export default createRoute(async (c) => {
  const db = database(c.env);
  const posts = await db
    .select()
    .from(post)
    .where(isNotNull(post.publishedAt))
    .orderBy(desc(post.publishedAt));

  return c.render(
    <Layout header={<Header isTop />}>
      <div
        class={css`
          margin-top: var(--space-y-md);
          padding: 0 var(--space-x-md);
        `}
      >
        <article
          class={css`
            font-family: var(--font-mono);
          `}
        >
          <header
            class={css`
              display: flex;
              font-size: var(--text-sm);
              color: var(--color-text-tertiary);
            `}
          >
            <span
              class={css`
                flex: 1 1 auto;
              `}
            >
              title
            </span>
            <span>date</span>
          </header>
          <ul
            class={css`
              margin-top: var(--space-y-md);
              list-style-type: none;
              display: flex;
              flex-direction: column;
              gap: var(--space-y-md);
            `}
          >
            {posts.map((post) => {
              if (!post.publishedAt) throw new Error("unexpected");
              return (
                <PostListItem
                  title={post.title}
                  slug={post.slug}
                  publishedAt={post.publishedAt}
                />
              );
            })}
          </ul>
        </article>
      </div>
    </Layout>,
    { title: "text.sushidesu.com" },
  );
});

const PostListItem: FC<{
  title: string;
  slug: string;
  publishedAt: Date;
}> = ({ title, slug, publishedAt }) => {
  return (
    <li
      class={css`
        display: flex;
        align-items: center;
        gap: var(--space-y-md);
      `}
    >
      <span
        class={css`
          flex: 1 1 auto;
        `}
      >
        <a href={`/posts/${slug}`}>{title}</a>
      </span>
      <span
        class={css`
          color: var(--color-text-secondary);
        `}
      >
        {formatDateTime(publishedAt)}
      </span>
    </li>
  );
};
