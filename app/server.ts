import { showRoutes } from "hono/dev";
import { trimTrailingSlash } from "hono/trailing-slash";
import { createApp } from "honox/server";

const app = createApp();

app.use(trimTrailingSlash());

showRoutes(app);

export default app;
