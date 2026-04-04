import { desc } from "drizzle-orm";
import { css } from "hono/css";
import { createRoute } from "honox/factory";
import { database } from "../../../db/client";
import { post } from "../../../db/schema";
import { formatDateTime } from "../../../ui/datetime";

export default createRoute(async (c) => {
  const db = database(c.env);
  const posts = await db.select().from(post).orderBy(desc(post.createdAt));

  return c.render(
    <div
      class={css`
        padding: var(--space-y-md) var(--space-x-md);
      `}
    >
      <h1>Hello Admin</h1>
      <div
        class={css`
          margin-top: var(--space-y-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-y-lg);
        `}
      >
        <a
          href={"/admin/posts/new"}
          role={"button"}
          class={css`
          `}
        >
          Create New
        </a>
        <ul
          class={css`
            display: flex;
            flex-direction: column;
            gap: var(--space-y-md);
          `}
        >
          {posts.map((p) => (
            <li
              key={p.slug}
              class={css`
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: var(--space-x-sm);
              `}
            >
              <p>{formatDateTime(p.createdAt)}</p>
              {p.publishedAt ? (
                <p
                  class={css`
                    flex: 0 0 auto;
                    width: 5rem;
                    text-align: right;
                  `}
                >
                  {formatDateTime(p.publishedAt)}
                </p>
              ) : (
                <p
                  class={css`
                    flex: 0 0 auto;
                    width: 5rem;
                    color: var(--color-text-secondary);
                    text-align: right;
                  `}
                >
                  非公開
                </p>
              )}
              <a href={`/admin/posts/${p.slug}`}>{p.title}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>,
  );
});
