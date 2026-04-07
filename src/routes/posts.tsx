import { and, eq, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { type AppBindings, database } from "../db/client";
import { post } from "../db/schema";
import { PostPage } from "../ui/post-page";

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
    <PostPage
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
