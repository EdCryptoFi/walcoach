/** Vercel entry: every /api/* request lands here; public/ is served as static files. */
import { waitUntil } from "@vercel/functions";
import { handle } from "hono/vercel";
import { createApp } from "../src/app.js";

const app = createApp((p) => waitUntil(p));
export const GET = handle(app);
export const POST = handle(app);
