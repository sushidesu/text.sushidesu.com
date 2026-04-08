import { Style, css } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";

const SITE_NAME = "text.sushidesu.com";
const SITE_URL = "https://text.sushidesu.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`;
const DEFAULT_DESCRIPTION = SITE_NAME;

export const renderer = jsxRenderer(
  ({ children, title, description, image, url, type }) => {
    const pageTitle = title ?? SITE_NAME;
    const pageDescription = description ?? DEFAULT_DESCRIPTION;
    const pageImage = image ?? DEFAULT_OG_IMAGE;
    const pageUrl = url ?? SITE_URL;
    const pageType = type ?? "website";
    return (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:type" content={pageType} />
          <meta property="og:url" content={pageUrl} />
          <meta property="og:image" content={pageImage} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          <meta name="twitter:image" content={pageImage} />
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
  },
);

export const siteUrl = SITE_URL;
