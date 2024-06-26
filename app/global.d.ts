import {} from "hono";

type Head = {
  title?: string;
};

declare module "hono" {
  interface Env {
    Variables: Record<string, unknown>;
    Bindings: {
      DB: D1Database;
    };
  }
  interface ContextRenderer {
    // biome-ignore lint: use interface to override
    (
      content: string | Promise<string>,
      head?: Head,
    ): Response | Promise<Response>;
  }
}
