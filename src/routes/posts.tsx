import { and, eq, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { type AppBindings, database } from "../db/client";
import { post } from "../db/schema";
import { renderPostBody } from "../post/render-body";
import { siteUrl } from "../renderer";
import { excerpt } from "../rsmarkup/textify";
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

  const bodyHtml = await renderPostBody(p.body, db, c.env.ASSET_BASE_URL);

  return c.render(
    <PostPage
      post={{
        title: p.title,
        slug: p.slug,
        bodyHtml,
        publishedAt: p.publishedAt,
      }}
    />,
    {
      title: `${p.title} | text.sushidesu.com`,
      description: excerpt(p.body),
      url: `${siteUrl}/posts/${p.slug}`,
      type: "article",
    },
  );
});
