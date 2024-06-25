import { Style, css } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <Script src="/app/client.ts" async />
        <Style>{css`
          :root {
            --space-x-xs: 0.25rem;
            --space-x-sm: 0.5rem;
            --space-x-md: 1rem;
            --space-x-lg: 2rem;
            --space-y-sm: 0.25rem;
            --space-y-md: 1rem;
            --space-y-lg: 2rem;
            --color-text-primary: #232733;
            --color-text-link: #0070f3;
            --color-text-subdued: #6e6c77;
            --font-mono: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
            --text-sm: 0.875rem;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: sans-serif;
            font-size: 16px;
            color: var(--color-text-primary);
            background-color: #e9eaed;
          }
        `}</Style>
      </head>
      <body
        class={css`
          max-width: 42rem;
          margin: 0 auto;
        `}
      >
        {children}
      </body>
    </html>
  );
});
