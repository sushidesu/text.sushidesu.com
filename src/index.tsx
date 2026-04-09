import { desc, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { type AppBindings, database } from "./db/client";
import { post } from "./db/schema";
import { renderer } from "./renderer";
import { adminRoutes } from "./routes/admin";
import { imagesRoutes } from "./routes/images";
import { postsRoutes } from "./routes/posts";
import { Header } from "./ui/header";
import { Layout } from "./ui/layout";
import { TextLink } from "./ui/link";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(renderer);

app.get("/", async (c) => {
  const db = database(c.env.DB);
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
        <article>
          <ul
            class={css`
              margin-top: var(--space-y-md);
              list-style-type: none;
              display: grid;
              grid-template-columns: auto 1fr;
              gap: var(--space-y-md) var(--space-x-md);
              align-items: center;
            `}
          >
            {posts.map((entry) => (
              <PostListItem
                title={entry.title}
                slug={entry.slug}
                publishedAt={entry.publishedAt}
              />
            ))}
          </ul>
        </article>
      </div>
    </Layout>,
    {
      title: "text.sushidesu.com",
      description: "sushidesu's third blog",
    },
  );
});

// R2 asset proxy (used in local dev, fallback in production)
app.get("/assets/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.ASSETS.get(key);
  if (!object) return c.notFound();
  c.header(
    "Content-Type",
    object.httpMetadata?.contentType ?? "application/octet-stream",
  );
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  return c.body(object.body);
});

app.route("/posts", postsRoutes);
app.route("/admin/images", imagesRoutes);
app.route("/admin", adminRoutes);

export default app;

const PostListItem: FC<{
  title: string;
  slug: string;
  publishedAt: Date | null;
}> = ({ title, slug, publishedAt }) => {
  return (
    <li
      class={css`
        display: contents;
      `}
    >
      {publishedAt ? (
        <time datetime={publishedAt.toISOString()}>
          {new Intl.DateTimeFormat("ja-JP").format(publishedAt)}
        </time>
      ) : (
        <span />
      )}
      <TextLink href={`/posts/${slug}`}>{title}</TextLink>
    </li>
  );
};
