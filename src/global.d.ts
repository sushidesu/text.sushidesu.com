import {} from "hono";

type Head = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
};

declare module "hono" {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      head?: Head,
    ): Response | Promise<Response>;
  }
}
