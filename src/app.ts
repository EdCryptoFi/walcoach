/**
 * The web API as a plain Hono app, shared by the local Node server
 * (src/web.ts) and the Vercel function (api/index.ts).
 *
 * It is stateless: the browser sends its short-term history and its memory
 * on/off flag with every request, and identity is an opaque `userId` the
 * browser generates once (`web-<uuid>`). Long-term memory lives on Walrus.
 */
import { readFileSync } from "node:fs";
import { waitUntil } from "@vercel/functions";
import { Hono } from "hono";
import { AREAS } from "./areas.js";
import { chat } from "./chat.js";
import { config } from "./config.js";
import type { Turn } from "./llm.js";
import { listMemories, memwal, namespaceFor, rememberExplicit } from "./memory.js";
import { stats } from "./stats.js";
import { hashUserId, nudgeEveryone, pushEnabled, subscribe } from "./push.js";

// Web user ids are strings; the pipeline keys everything by number, so hash them.
export const numericId = hashUserId;

const VALID_ID = /^web-[a-z0-9-]{8,64}$/i;

// Throttles so one visitor (or one script minting many userIds) cannot burn the
// shared Walrus/Groq budget. In-memory, so per function instance on serverless —
// a soft limit; the relayer's own rate limit is the hard one and we degrade gracefully.
const WINDOW_MS = 60_000;
const LIMITS = { user: 10, ip: 30, global: 200 };
const buckets = new Map<string, number[]>();
function take(key: string, max: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) return false;
  recent.push(now);
  buckets.set(key, recent);
  return true;
}
function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "local").split(",")[0].trim();
}
/** Returns an error message when the caller should back off, else null. */
function throttled(c: { req: { header: (n: string) => string | undefined } }, userId: string): string | null {
  if (!take("global", LIMITS.global)) return "The coach is busy right now — try again in a minute.";
  if (!take(`ip:${clientIp(c)}`, LIMITS.ip)) return "Too many requests from your network — try again in a minute.";
  if (!take(`user:${userId}`, LIMITS.user)) return "Slow down a little — 10 messages per minute.";
  return null;
}

interface ChatBody { userId?: string; name?: string; text?: string; memory?: boolean; history?: Turn[] }

function cleanHistory(h: unknown): Turn[] {
  if (!Array.isArray(h)) return [];
  return h
    .filter((t): t is Turn => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }))
    .slice(-12);
}

// On Vercel, waitUntil keeps the function alive while background learning finishes.
// Outside Vercel it is a no-op (there is no request context), and the promise just runs.
function keepAlive(p: Promise<unknown>) {
  try { waitUntil(p); } catch { /* not on Vercel */ }
}

const pages = new Map<string, string>();
function page(name: string): string {
  let html = pages.get(name);
  if (!html) {
    html = readFileSync(new URL(`../public/${name}`, import.meta.url), "utf8");
    pages.set(name, html);
  }
  return html;
}

export function createApp() {
  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Frame-Options", "DENY");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  });

  // Pages. Local dev also serves ./public statically (src/web.ts).
  app.get("/", (c) => c.html(page("index.html")));
  app.get("/chat", (c) => c.html(page("chat.html")));
  app.get("/sw.js", (c) => c.body(page("sw.js"), 200, { "content-type": "application/javascript; charset=utf-8", "service-worker-allowed": "/" }));
  app.get("/icon.svg", (c) => c.body(page("icon.svg"), 200, { "content-type": "image/svg+xml" }));

  app.get("/api/areas", (c) => c.json({ areas: AREAS }));

  // ---- proactive nudges (Web Push) ----
  app.get("/api/push/config", (c) => c.json({ enabled: pushEnabled, publicKey: config.vapidPublicKey }));

  app.post("/api/push/subscribe", async (c) => {
    if (!pushEnabled) return c.json({ error: "push is not configured" }, 503);
    const { userId, name, subscription } = (await c.req.json().catch(() => ({}))) as { userId?: string; name?: string; subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
    if (!userId || !VALID_ID.test(userId) || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys.auth) return c.json({ error: "userId and subscription are required" }, 400);
    if (!/^https:\/\//.test(subscription.endpoint) || subscription.endpoint.length > 1024) return c.json({ error: "invalid endpoint" }, 400);
    const wait = throttled(c, userId);
    if (wait) return c.json({ error: wait }, 429);
    try {
      await subscribe(userId, (name || "friend").slice(0, 40), { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } });
      return c.json({ ok: true });
    } catch (err) {
      console.error("[push] subscribe failed", (err as Error).message.slice(0, 200));
      return c.json({ error: "Could not save the subscription right now." }, 503);
    }
  });

  // Called by Vercel Cron (Authorization: Bearer <CRON_SECRET>) or manually with the same header.
  app.get("/api/cron/nudge", async (c) => {
    if (!config.cronSecret || c.req.header("authorization") !== `Bearer ${config.cronSecret}`) return c.json({ error: "unauthorized" }, 401);
    if (!pushEnabled) return c.json({ error: "push is not configured" }, 503);
    const report = await nudgeEveryone();
    console.log("[nudge]", JSON.stringify(report));
    return c.json(report);
  });

  app.post("/api/chat", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as ChatBody;
    const { userId, name, text } = body;
    if (!userId || !VALID_ID.test(userId) || !text?.trim()) return c.json({ error: "userId and text are required" }, 400);
    const wait = throttled(c, userId);
    if (wait) return c.json({ error: wait }, 429);
    const id = numericId(userId);
    const userName = (name || "friend").slice(0, 40);
    const useMemory = body.memory !== false;
    stats.recordMessage(id, userName);
    try {
      const { reply, memories, memoryAvailable, facts, learning } = await chat(id, userName, text.trim().slice(0, 2000), { useMemory, history: cleanHistory(body.history) });
      keepAlive(learning);
      return c.json({ reply, memories, memory: useMemory, memoryAvailable, facts });
    } catch (err) {
      console.error(`[web] user=${id}`, err);
      return c.json({ error: "Something broke on my side — try again in a moment." }, 500);
    }
  });

  // POST, not GET: the memory key is the user's identity and must not end up in URL logs.
  app.post("/api/memories", async (c) => {
    const { userId } = (await c.req.json().catch(() => ({}))) as { userId?: string };
    if (!userId || !VALID_ID.test(userId)) return c.json({ error: "invalid userId" }, 400);
    const wait = throttled(c, userId);
    if (wait) return c.json({ error: wait }, 429);
    try {
      const memories = await listMemories(numericId(userId));
      return c.json({ memories, namespace: namespaceFor(numericId(userId)) });
    } catch (err) {
      console.error(`[web] memories user=${numericId(userId)}`, (err as Error).message.slice(0, 200));
      return c.json({ error: "Memory is temporarily unavailable." }, 503);
    }
  });

  app.post("/api/remember", async (c) => {
    const { userId, name, fact } = (await c.req.json().catch(() => ({}))) as { userId?: string; name?: string; fact?: string };
    if (!userId || !VALID_ID.test(userId) || !fact?.trim()) return c.json({ error: "userId and fact are required" }, 400);
    const wait = throttled(c, userId);
    if (wait) return c.json({ error: wait }, 429);
    try {
      const result = await rememberExplicit(numericId(userId), (name || "friend").slice(0, 40), fact.trim().slice(0, 500));
      return c.json({ blobId: result.blob_id });
    } catch (err) {
      console.error(`[web] remember user=${numericId(userId)}`, (err as Error).message.slice(0, 200));
      return c.json({ error: "Memory is temporarily unavailable." }, 503);
    }
  });

  app.get("/api/health", async (c) => {
    const health = await memwal.health();
    return c.json({ relayer: health.status, model: config.groqModel });
  });

  return app;
}

/** Vercel's Hono preset looks for a default export on the entrypoint. */
export default createApp();
