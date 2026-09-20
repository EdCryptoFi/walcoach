/** Local Node server: static page + the shared API (see src/app.ts). */
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./app.js";
import { config } from "./config.js";
import { memwal } from "./memory.js";

const PORT = Number(process.env.PORT ?? 3000);
app.use("/*", serveStatic({ root: "./public" }));

const health = await memwal.health();
console.log(`Walrus Memory relayer: ${health.status} v${health.version} (${config.memwalServerUrl})`);
console.log(`LLM: ${config.groqModel} via Groq`);
serve({ fetch: app.fetch, port: PORT }, () => console.log(`Web chat on http://localhost:${PORT}`));
