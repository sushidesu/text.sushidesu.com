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
            line-height: 1.7;

            h1, h2, h3, h4, h5, h6 {
              font-weight: bold;
              margin-top: var(--space-y-lg);
              margin-bottom: var(--space-y-md);
            }
            h1 { font-size: 1.2rem; }
            h2 { font-size: 1.05rem; }
            h3, h4, h5, h6 { font-size: 1rem; }

            p {
              margin-top: var(--space-y-md);
            }

            ul {
              margin-top: var(--space-y-md);
              padding-left: 1.5rem;
              list-style: disc;
            }
            li + li {
              margin-top: var(--space-y-sm);
            }

            a {
              color: inherit;
              text-decoration: underline;
              overflow-wrap: anywhere;
            }
            a:hover {
              color: var(--color-link-hover);
            }

            code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              font-size: 0.9em;
              background: #f4f4f4;
              padding: 0.1em 0.3em;
              border-radius: 3px;
            }

            pre {
              margin-top: var(--space-y-md);
              padding: var(--space-y-sm) var(--space-x-sm);
              background: #f4f4f4;
              border-radius: 4px;
              overflow-x: auto;
            }
            pre code {
              background: none;
              padding: 0;
              border-radius: 0;
              font-size: 0.9em;
            }

            > *:first-child {
              margin-top: 0;
            }
          `}
        >
          {raw(render(parse(post.body)))}
        </div>
      </div>
    </Layout>
  );
};
