import { Style, css } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Style>{css`
          :root {
            --space-x-sm: 0.5rem;
            --space-x-md: 1rem;
            --space-x-lg: 2rem;
            --space-y-sm: 0.25rem;
            --space-y-md: 1rem;
            --space-y-lg: 2rem;
            --color-link-hover: #0070f3;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
body {
            font-family: "Inter","Inter Fallback","Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif;
            font-size: 16px;
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
