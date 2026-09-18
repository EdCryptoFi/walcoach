/**
 * Web channel: serves the single-page chat UI and a tiny JSON API on top of
 * the same recall → generate → learn pipeline the Telegram bot uses.
 *
 * Identity is an opaque `userId` the browser generates once and keeps in
 * localStorage (`web-<uuid>`). Swapping that for a signed Sui address later
 * only changes how the id is produced — everything below stays the same.
 */
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { chat, resetHistory } from "./chat.js";
import { config } from "./config.js";
import { listMemories, memwal, rememberExplicit } from "./memory.js";
import { stats } from "./stats.js";

const app = new Hono();
const PORT = Number(process.env.PORT ?? 3000);

// Web user ids are strings; the pipeline keys everything by number, so hash them.
function numericId(userId: string): number {
  let h = 2166136261;
  for (const ch of userId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % 2_000_000_000;
}

const VALID_ID = /^web-[a-z0-9-]{8,64}$/i;
const memoryDisabled = new Set<number>();

interface ChatBody { userId?: string; name?: string; text?: string; memory?: boolean }

app.post("/api/chat", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as ChatBody;
  const { userId, name, text } = body;
  if (!userId || !VALID_ID.test(userId) || !text?.trim()) return c.json({ error: "userId and text are required" }, 400);
  const id = numericId(userId);
  const userName = (name || "friend").slice(0, 40);
  const useMemory = body.memory !== false && !memoryDisabled.has(id);
  stats.recordMessage(id, userName);
  try {
    const { reply, memories, learning } = await chat(id, userName, text.trim().slice(0, 2000), useMemory);
    void learning;
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
  return c.json({ memories, namespace: `${config.namespacePrefix}-${numericId(userId)}` });
});

app.post("/api/remember", async (c) => {
  const { userId, name, fact } = (await c.req.json().catch(() => ({}))) as { userId?: string; name?: string; fact?: string };
  if (!userId || !VALID_ID.test(userId) || !fact?.trim()) return c.json({ error: "userId and fact are required" }, 400);
  const result = await rememberExplicit(numericId(userId), (name || "friend").slice(0, 40), fact.trim().slice(0, 500));
  return c.json({ blobId: result.blob_id });
});

app.post("/api/memory", async (c) => {
  const { userId, enabled } = (await c.req.json().catch(() => ({}))) as { userId?: string; enabled?: boolean };
  if (!userId || !VALID_ID.test(userId)) return c.json({ error: "invalid userId" }, 400);
  const id = numericId(userId);
  if (enabled) memoryDisabled.delete(id);
  else memoryDisabled.add(id);
  return c.json({ memory: !memoryDisabled.has(id) });
});

app.post("/api/reset", async (c) => {
  const { userId } = (await c.req.json().catch(() => ({}))) as { userId?: string };
  if (!userId || !VALID_ID.test(userId)) return c.json({ error: "invalid userId" }, 400);
  resetHistory(numericId(userId));
  return c.json({ ok: true });
});

app.get("/api/health", async (c) => {
  const health = await memwal.health();
  return c.json({ relayer: health.status, model: config.groqModel });
});

app.use("/*", serveStatic({ root: "./public" }));

const health = await memwal.health();
console.log(`Walrus Memory relayer: ${health.status} v${health.version} (${config.memwalServerUrl})`);
console.log(`LLM: ${config.groqModel} via Groq`);
serve({ fetch: app.fetch, port: PORT }, () => console.log(`Web chat on http://localhost:${PORT}`));
