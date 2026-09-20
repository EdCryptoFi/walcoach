/**
 * The web API as a plain Hono app, shared by the local Node server
 * (src/web.ts) and the Vercel function (api/index.ts).
 *
 * It is stateless: the browser sends its short-term history and its memory
 * on/off flag with every request, and identity is an opaque `userId` the
 * browser generates once (`web-<uuid>`). Long-term memory lives on Walrus.
 */
import { Hono } from "hono";
import { chat } from "./chat.js";
import { config } from "./config.js";
import type { Turn } from "./llm.js";
import { listMemories, memwal, namespaceFor, rememberExplicit } from "./memory.js";
import { stats } from "./stats.js";

// Web user ids are strings; the pipeline keys everything by number, so hash them.
export function numericId(userId: string): number {
  let h = 2166136261;
  for (const ch of userId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % 2_000_000_000;
}

const VALID_ID = /^web-[a-z0-9-]{8,64}$/i;

// Per-user throttle so one visitor cannot burn the shared Walrus/Groq budget.
// In-memory, so per function instance on serverless — a soft limit, good enough here.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();
function throttled(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(userId, recent);
  return false;
}

interface ChatBody { userId?: string; name?: string; text?: string; memory?: boolean; history?: Turn[] }

function cleanHistory(h: unknown): Turn[] {
  if (!Array.isArray(h)) return [];
  return h
    .filter((t): t is Turn => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }))
    .slice(-12);
}

/** `keepAlive` lets a serverless host keep the function alive while learning finishes. */
export function createApp(keepAlive: (p: Promise<unknown>) => void = () => {}) {
  const app = new Hono();

  app.post("/api/chat", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as ChatBody;
    const { userId, name, text } = body;
    if (!userId || !VALID_ID.test(userId) || !text?.trim()) return c.json({ error: "userId and text are required" }, 400);
    if (throttled(userId)) return c.json({ error: "Slow down a little — 10 messages per minute." }, 429);
    const id = numericId(userId);
    const userName = (name || "friend").slice(0, 40);
    const useMemory = body.memory !== false;
    stats.recordMessage(id, userName);
    try {
      const { reply, memories, learning } = await chat(id, userName, text.trim().slice(0, 2000), { useMemory, history: cleanHistory(body.history) });
      keepAlive(learning);
      return c.json({ reply, memories, memory: useMemory });
    } catch (err) {
      console.error(`[web] user=${id}`, err);
      return c.json({ error: "Something broke on my side — try again in a moment." }, 500);
    }
  });

  app.get("/api/memories", async (c) => {
    const userId = c.req.query("userId") ?? "";
    if (!VALID_ID.test(userId)) return c.json({ error: "invalid userId" }, 400);
    const memories = await listMemories(numericId(userId));
    return c.json({ memories, namespace: namespaceFor(numericId(userId)) });
  });

  app.post("/api/remember", async (c) => {
    const { userId, name, fact } = (await c.req.json().catch(() => ({}))) as { userId?: string; name?: string; fact?: string };
    if (!userId || !VALID_ID.test(userId) || !fact?.trim()) return c.json({ error: "userId and fact are required" }, 400);
    const result = await rememberExplicit(numericId(userId), (name || "friend").slice(0, 40), fact.trim().slice(0, 500));
    return c.json({ blobId: result.blob_id });
  });

  app.get("/api/health", async (c) => {
    const health = await memwal.health();
    return c.json({ relayer: health.status, model: config.groqModel });
  });

  return app;
}
