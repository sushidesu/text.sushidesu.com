import { isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { type AppBindings, database } from "./db/client";
import { post } from "./db/schema";
import { renderer } from "./renderer";
import { adminRoutes } from "./routes/admin";
import { postsRoutes } from "./routes/posts";
import { Header } from "./ui/header";
import { Layout } from "./ui/layout";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(renderer);

app.get("/", async (c) => {
  const db = database(c.env.DB);
  const posts = await db.select().from(post).where(isNotNull(post.publishedAt));

  return c.render(
    <Layout header={<Header isTop />}>
      <div
        class={css`
          margin-top: var(--space-y-md);
          padding: 0 var(--space-x-md);
        `}
      >
        <article>
          <ul
            class={css`
              margin-top: var(--space-y-md);
              list-style-type: none;
              display: flex;
              flex-direction: column;
              gap: var(--space-y-sm);
            `}
          >
            {posts.map((entry) => (
              <PostListItem title={entry.title} slug={entry.slug} />
            ))}
          </ul>
        </article>
      </div>
    </Layout>,
    { title: "text.sushidesu.com" },
  );
});

app.route("/posts", postsRoutes);
app.route("/admin", adminRoutes);

export default app;

const PostListItem: FC<{
  title: string;
  slug: string;
}> = ({ title, slug }) => {
  return (
    <li
      class={css`
        display: flex;
        flex-direction: column;
        gap: var(--space-y-sm);
      `}
    >
      <a
        href={`/posts/${slug}`}
        class={css`
          color: var(--color-text-link);
        `}
      >
        {title}
      </a>
      <span>2024/06/09</span>
    </li>
  );
};
