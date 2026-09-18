/**
 * Thin wrapper around the Walrus Memory SDK.
 *
 * Every Telegram user gets their own namespace (`<prefix>-<telegramUserId>`),
 * so recall for one user can never surface another user's memories — the
 * relayer enforces owner+namespace isolation at the query level.
 *
 * Request budget matters: the relayer rate-limits per delegate key
 * (60 weighted requests/min) and per account (1000/hour), and one bot serves
 * every user with a single key. So this module is deliberately frugal:
 * ~1 recall per message, one bulk write per exchange, no extra dedupe calls.
 */
import { MemWal } from "@mysten-incubation/memwal";
import { config } from "./config.js";
import { extractFacts } from "./extract.js";
import { stats } from "./stats.js";

export const memwal = MemWal.create({
  key: config.memwalKey,
  accountId: config.memwalAccountId,
  serverUrl: config.memwalServerUrl,
  namespace: config.namespacePrefix,
});

export function namespaceFor(userId: number | string): string {
  return `${config.namespacePrefix}-${userId}`;
}

export interface Memory {
  text: string;
  distance: number;
  blobId: string;
}

// Cosine-distance cutoff observed with the relayer's embedding model.
// Cross-language hits (PT question, EN fact) land around 0.55–0.75, so the
// cutoff is deliberately loose; the LLM is told to ignore what isn't useful.
const RELEVANT = 0.8;
const PROFILE_QUERY = "the user's main goal, deadline, weekly schedule, constraints and current struggle";
const PROFILE_TTL_MS = 10 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryAfterMs(err: unknown): number | undefined {
  const m = /retry_after_seconds"?\s*:\s*(\d+)/.exec((err as Error).message ?? "");
  return m ? Number(m[1]) * 1000 : undefined;
}

/** Retry transient relayer failures with backoff; honour 429 retry_after (capped). */
async function withRetry<T>(label: string, fn: () => Promise<T>, { tries = 3, maxWaitMs = 90_000 } = {}): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err as Error).message ?? "";
      // Seen in practice: 500/503 from the extractor upstream, "Too Many Requests"
      // when the relayer's own Sui RPC is throttled during SEAL encryption, 429
      // with retry_after_seconds from the relayer's rate limiter, job timeouts.
      const transient = /\b(429|5\d\d)\b|Too Many Requests|seal encrypt failed|job failed|ECONNRESET|ETIMEDOUT|fetch failed|timed out/i.test(msg);
      if (!transient || attempt === tries) throw err;
      const delay = Math.min(retryAfterMs(err) ?? 2000 * 2 ** (attempt - 1), maxWaitMs);
      console.warn(`[retry]  ${label} attempt ${attempt} failed (${msg.slice(0, 90)}), retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function toMemory(r: { blob_id: string; text: string; distance: number }): Memory {
  return { text: r.text, distance: r.distance, blobId: r.blob_id };
}

function knownToHaveMemories(userId: number): boolean {
  return (stats.all()[userId]?.facts ?? 0) > 0;
}

// Per-user cache of the "core profile" recall so short messages like
// "hi, I'm back" still surface goals/schedule without a second request each turn.
const profileCache = new Map<number, { at: number; memories: Memory[] }>();

async function profileFor(userId: number): Promise<Memory[]> {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.at < PROFILE_TTL_MS) return cached.memories;
  const result = await withRetry("recall", () => memwal.recall({ query: PROFILE_QUERY, namespace: namespaceFor(userId), limit: 5 }), { tries: 2, maxWaitMs: 3000 });
  const memories = result.results.map(toMemory);
  profileCache.set(userId, { at: Date.now(), memories });
  return memories;
}

/**
 * What we know about this user that matters for `query`: one recall driven by
 * the message, merged with the (cached) core profile. If the relayer is rate
 * limited we answer without memory rather than make the user wait.
 */
export async function recallForUser(userId: number, query: string, limit = 8, attempt = 1): Promise<Memory[]> {
  const started = Date.now();
  const namespace = namespaceFor(userId);
  let byMessage: Memory[] = [];
  let profile: Memory[] = [];
  try {
    [byMessage, profile] = await Promise.all([
      withRetry("recall", () => memwal.recall({ query, namespace, limit, maxDistance: RELEVANT }), { tries: 2, maxWaitMs: 3000 }).then((r) => r.results.map(toMemory)),
      profileFor(userId),
    ]);
  } catch (err) {
    console.error(`[recall] user=${userId} unavailable, answering without memory: ${(err as Error).message.slice(0, 120)}`);
    return [];
  }

  const seen = new Set<string>();
  const merged = [...byMessage, ...profile].filter((m) => !seen.has(m.blobId) && seen.add(m.blobId));
  merged.sort((a, b) => a.distance - b.distance);
  const memories = merged.slice(0, limit);

  if (memories.length === 0 && attempt < 2 && knownToHaveMemories(userId)) {
    // Observed: the relayer occasionally returns an empty result set (no error)
    // for a namespace that has memories. Retry once before answering blind.
    console.warn(`[recall] user=${userId} empty result for a user with stored facts — retrying`);
    profileCache.delete(userId);
    await sleep(1500);
    return recallForUser(userId, query, limit, attempt + 1);
  }

  console.log(`[recall] user=${userId} q="${query.slice(0, 60)}" hits=${memories.length} (msg=${byMessage.length}, profile=${profile.length}) ${Date.now() - started}ms`);
  for (const m of memories) console.log(`         ${m.distance.toFixed(3)}  ${m.text}`);
  return memories;
}

/** Broad recall used by /memories — no relevance cutoff. */
export async function listMemories(userId: number, limit = 25): Promise<Memory[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await withRetry("recall", () =>
      memwal.recall({ query: "facts, preferences, goals, habits, struggles and personal details about the user", namespace: namespaceFor(userId), limit }),
    );
    if (result.results.length > 0 || !knownToHaveMemories(userId)) return result.results.map(toMemory);
    console.warn(`[recall] user=${userId} /memories came back empty for a user with stored facts — retrying`);
    await sleep(1500);
  }
  return [];
}

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Extract durable facts from the latest exchange and store them on Walrus in
 * one bulk write. Runs after the reply is sent so the user never waits.
 *
 * `known` is what was recalled for this turn: it is passed to the extractor
 * so it doesn't re-state facts we already have (no extra relayer calls).
 *
 * MEMORY_EXTRACTOR=llm (default): our model extracts, then `rememberBulkAndWait`.
 * MEMORY_EXTRACTOR=relayer: the relayer's `analyzeAndWait` does extraction + storage.
 */
export async function learnFromExchange(userId: number, userName: string, userMessage: string, assistantReply: string, known: Memory[] = []) {
  const namespace = namespaceFor(userId);
  try {
    if (config.extractor === "relayer") {
      const text = `User (${userName}): ${userMessage}\nCoach: ${assistantReply}`;
      const result = await withRetry("analyze", () => memwal.analyzeAndWait(text, namespace, { timeoutMs: 60_000, pollIntervalMs: 3000 }));
      console.log(`[learn]  user=${userId} relayer stored ${result.succeeded}/${result.facts.length} facts`);
      for (const fact of result.facts) console.log(`         + ${fact.text}`);
      stats.recordFacts(userId, userName, result.facts.map((f) => f.text));
      profileCache.delete(userId);
      return;
    }

    const knownTexts = known.map((m) => m.text);
    const knownSet = new Set(knownTexts.map(normalize));
    const facts = (await extractFacts(userName, userMessage, assistantReply, knownTexts)).filter((f) => !knownSet.has(normalize(f)));
    if (facts.length === 0) {
      console.log(`[learn]  user=${userId} no new facts`);
      return;
    }

    const result = await withRetry("remember", () =>
      memwal.rememberBulkAndWait(facts.map((text) => ({ text, namespace })), { timeoutMs: 90_000, pollIntervalMs: 3000 }),
    );
    const stored = result.results.filter((r) => r.status === "done");
    result.results.forEach((r, i) => console.log(`         ${r.status === "done" ? "+" : "!"} ${facts[i]}  [${r.blob_id || r.error}]`));
    console.log(`[learn]  user=${userId} stored ${stored.length}/${facts.length} facts`);
    stats.recordFacts(userId, userName, stored.map((_, i) => facts[i]));
    if (stored.length > 0) profileCache.delete(userId);
  } catch (err) {
    console.error(`[learn]  user=${userId} failed:`, (err as Error).message.slice(0, 200));
  }
}

/** Store one explicit fact the user asked us to remember. */
export async function rememberExplicit(userId: number, userName: string, fact: string) {
  const result = await withRetry("remember", () => memwal.rememberAndWait(fact, namespaceFor(userId), { timeoutMs: 60_000, pollIntervalMs: 3000 }));
  stats.recordFacts(userId, userName, [fact]);
  profileCache.delete(userId);
  console.log(`[remember] user=${userId} blob=${result.blob_id} "${fact}"`);
  return result;
}
