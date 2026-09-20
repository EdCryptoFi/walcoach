/**
 * Proactive nudges via Web Push.
 *
 * There is no database, so push subscriptions live in Walrus Memory too: one
 * registry namespace (`<prefix>-push`) holds one entry per subscription. The
 * daily cron recalls the registry, then for each user recalls their profile,
 * asks the model for a one-line nudge grounded in those memories, and pushes it.
 */
import webpush, { type PushSubscription } from "web-push";
import { OpenAI } from "openai";
import { config } from "./config.js";
import { memwal, namespaceFor, type Memory } from "./memory.js";

export const pushEnabled = Boolean(config.vapidPublicKey && config.vapidPrivateKey);
if (pushEnabled) webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);

const REGISTRY = `${config.namespacePrefix}-push`;
const groq = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });

interface Registration { userId: string; name: string; subscription: PushSubscription; blobId: string }

export async function subscribe(userId: string, name: string, subscription: PushSubscription) {
  const text = `push subscription for user ${userId} (${name}) json:${JSON.stringify({ userId, name, subscription })}`;
  return memwal.rememberAndWait(text, REGISTRY, { timeoutMs: 60_000, pollIntervalMs: 3000 });
}

/** Everything in the registry, newest subscription per endpoint. */
export async function registrations(limit = 100): Promise<Registration[]> {
  const result = await memwal.recall({ query: "push subscription for user", namespace: REGISTRY, limit });
  const byEndpoint = new Map<string, Registration>();
  for (const r of result.results) {
    const i = r.text.indexOf("json:");
    if (i < 0) continue;
    try {
      const parsed = JSON.parse(r.text.slice(i + 5)) as { userId: string; name: string; subscription: PushSubscription };
      if (parsed.subscription?.endpoint) byEndpoint.set(parsed.subscription.endpoint, { ...parsed, blobId: r.blob_id });
    } catch { /* ignore malformed */ }
  }
  return [...byEndpoint.values()];
}

async function composeNudge(name: string, memories: Memory[]): Promise<string | null> {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0.7,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content: `You are ${config.botName}, a personal coach. Write ONE short push notification (max 110 characters) for ${name}, grounded in what you remember about them. Today is ${today}. Reference a concrete goal, schedule item or struggle; if today is a day they said they train/study/etc., mention it. Warm, direct, no emojis, no quotes. Write in the language the memories are written in. If nothing in the memories is worth a nudge today, reply exactly: SKIP`,
      },
      { role: "user", content: memories.map((m) => `- ${m.text}`).join("\n") },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  return !text || text.toUpperCase().startsWith("SKIP") ? null : text.slice(0, 140);
}

export interface NudgeReport { total: number; sent: number; skipped: number; expired: number; failed: number }

/** Run by the daily cron. Sequential on purpose: the relayer budget is shared. */
export async function nudgeEveryone(): Promise<NudgeReport> {
  const regs = await registrations();
  const report: NudgeReport = { total: regs.length, sent: 0, skipped: 0, expired: 0, failed: 0 };
  for (const reg of regs) {
    try {
      const profile = await memwal.recall({
        query: "the user's main goal, weekly schedule, deadline, constraints and current struggle",
        namespace: namespaceFor(hashUserId(reg.userId)),
        limit: 6,
      });
      const memories = profile.results.map((r) => ({ text: r.text, distance: r.distance, blobId: r.blob_id }));
      const body = memories.length ? await composeNudge(reg.name, memories) : null;
      if (!body) {
        report.skipped++;
        console.log(`[nudge] skipped user=${hashUserId(reg.userId)} memories=${memories.length}${memories.length ? " (model said SKIP)" : ""}`);
        continue;
      }
      console.log(`[nudge] user=${hashUserId(reg.userId)} memories=${memories.length} body="${body}"`);
      await webpush.sendNotification(reg.subscription, JSON.stringify({ title: config.botName, body, url: "/chat" }), { TTL: 6 * 3600 });
      report.sent++;
      console.log(`[nudge] sent to user=${hashUserId(reg.userId)}`);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) report.expired++;
      else { report.failed++; console.error(`[nudge] failed:`, (err as Error).message.slice(0, 160)); }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return report;
}

// Same hash as app.ts so the registry can find each user's namespace.
export function hashUserId(userId: string): number {
  let h = 2166136261;
  for (const ch of userId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % 2_000_000_000;
}
