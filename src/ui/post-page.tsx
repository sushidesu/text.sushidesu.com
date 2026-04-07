import { css } from "hono/css";
import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import { parse } from "../rsmarkup/parse";
import { render } from "../rsmarkup/render";
import { Header } from "./header";
import { Layout } from "./layout";

type PostPageProps = {
  post: {
    title: string;
    slug: string;
    body: string;
    publishedAt: Date | null;
  };
};

export const PostPage: FC<PostPageProps> = ({ post }) => {
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
        <div
          class={css`
            margin-top: var(--space-y-lg);
          `}
        >
          {raw(render(parse(post.body)))}
        </div>
      </div>
    </Layout>
  );
};
