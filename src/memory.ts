/**
 * Thin wrapper around the Walrus Memory SDK.
 *
 * Every Telegram user gets their own namespace (`<prefix>-<telegramUserId>`),
 * so recall for one user can never surface another user's memories — the
 * relayer enforces owner+namespace isolation at the query level.
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

// Cosine-distance thresholds observed with the relayer's embedding model.
// Cross-language hits (PT question, EN fact) land around 0.55–0.70, so the
// cutoff is deliberately loose; the LLM is told to ignore what isn't useful.
const RELEVANT = 0.8;
const DUPLICATE = 0.15;

/** Retry transient relayer failures (5xx / network) with a short backoff. */
async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err as Error).message ?? "";
      // Seen in practice: 500/503 from the extractor upstream, "Too Many Requests"
      // when the relayer's Sui RPC is rate-limited during SEAL encryption, and
      // job timeouts while the relayer is under load.
      const transient = /\b(5\d\d)\b|Too Many Requests|seal encrypt failed|job failed|ECONNRESET|ETIMEDOUT|fetch failed|timed out/i.test(msg);
      if (!transient || attempt === tries) throw err;
      const delay = 2000 * 2 ** (attempt - 1);
      console.warn(`[retry]  ${label} attempt ${attempt} failed (${msg.slice(0, 80)}), retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function toMemory(r: { blob_id: string; text: string; distance: number }): Memory {
  return { text: r.text, distance: r.distance, blobId: r.blob_id };
}

/**
 * What we know about this user that matters for `query`.
 *
 * Two recalls, merged: one driven by the message itself, one by a fixed
 * "core profile" query so short messages like "hi, I'm back" still surface
 * the user's goals, schedule and constraints.
 */
export async function recallForUser(userId: number, query: string, limit = 8, attempt = 1): Promise<Memory[]> {
  const started = Date.now();
  const namespace = namespaceFor(userId);
  const [byMessage, profile] = await Promise.all([
    withRetry("recall", () => memwal.recall({ query, namespace, limit, maxDistance: RELEVANT })),
    withRetry("recall", () => memwal.recall({ query: "the user's main goal, deadline, weekly schedule, constraints and current struggle", namespace, limit: 5 })),
  ]);
  const seen = new Set<string>();
  const merged: Memory[] = [];
  for (const r of [...byMessage.results, ...profile.results]) {
    if (seen.has(r.blob_id)) continue;
    seen.add(r.blob_id);
    merged.push(toMemory(r));
  }
  merged.sort((a, b) => a.distance - b.distance);
  const memories = merged.slice(0, limit);
  if (memories.length === 0 && attempt < 3 && knownToHaveMemories(userId)) {
    // Observed: the relayer occasionally returns an empty result set (no error)
    // for a namespace that has memories. Retry once before answering blind.
    console.warn(`[recall] user=${userId} empty result for a user with stored facts — retrying (${attempt})`);
    await new Promise((r) => setTimeout(r, 1500));
    return recallForUser(userId, query, limit, attempt + 1);
  }
  console.log(`[recall] user=${userId} q="${query.slice(0, 60)}" hits=${memories.length} (msg=${byMessage.results.length}, profile=${profile.results.length}) ${Date.now() - started}ms`);
  for (const m of memories) console.log(`         ${m.distance.toFixed(3)}  ${m.text}`);
  return memories;
}

/** Broad recall used by /memories — no relevance cutoff, just "everything close to being about the user". */
export async function listMemories(userId: number, limit = 25): Promise<Memory[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await withRetry("recall", () =>
      memwal.recall({
        query: "facts, preferences, goals, habits, struggles and personal details about the user",
        namespace: namespaceFor(userId),
        limit,
      }),
    );
    if (result.results.length > 0 || !knownToHaveMemories(userId)) return result.results.map(toMemory);
    console.warn(`[recall] user=${userId} /memories came back empty for a user with stored facts — retrying (${attempt})`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}

function knownToHaveMemories(userId: number): boolean {
  return (stats.all()[userId]?.facts ?? 0) > 0;
}

/** Skip facts that are near-duplicates of something already stored. */
async function isDuplicate(namespace: string, fact: string): Promise<boolean> {
  const existing = await withRetry("recall", () => memwal.recall({ query: fact, namespace, limit: 1, maxDistance: DUPLICATE }));
  const dup = existing.results[0];
  if (dup) console.log(`         = ${fact} (duplicate of "${dup.text}", d=${dup.distance.toFixed(3)}, skipped)`);
  return Boolean(dup);
}

/**
 * Extract durable facts from the latest exchange and store each one as its
 * own encrypted blob on Walrus. Runs after the reply is sent so the user
 * never waits on storage.
 *
 * MEMORY_EXTRACTOR=llm (default): our model extracts, we dedupe, then `rememberAndWait` per fact.
 * MEMORY_EXTRACTOR=relayer: the relayer's `analyzeAndWait` does extraction + storage in one call.
 */
export async function learnFromExchange(userId: number, userName: string, userMessage: string, assistantReply: string) {
  const namespace = namespaceFor(userId);
  try {
    if (config.extractor === "relayer") {
      const text = `User (${userName}): ${userMessage}\nCoach: ${assistantReply}`;
      const result = await withRetry("analyze", () => memwal.analyzeAndWait(text, namespace, { timeoutMs: 60_000 }));
      console.log(`[learn]  user=${userId} relayer stored ${result.succeeded}/${result.facts.length} facts`);
      for (const fact of result.facts) console.log(`         + ${fact.text}`);
      stats.recordFacts(userId, userName, result.facts.map((f) => f.text));
      return;
    }

    const facts = await extractFacts(userName, userMessage, assistantReply);
    if (facts.length === 0) {
      console.log(`[learn]  user=${userId} no new facts`);
      return;
    }
    const stored: string[] = [];
    for (const fact of facts) {
      if (await isDuplicate(namespace, fact)) continue;
      const result = await withRetry("remember", () => memwal.rememberAndWait(fact, namespace, { timeoutMs: 60_000 }));
      console.log(`         + ${fact}  [${result.blob_id}]`);
      stored.push(fact);
      // Be gentle with the relayer: each remember triggers a Sui RPC read + SEAL encrypt + Walrus upload.
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.log(`[learn]  user=${userId} stored ${stored.length}/${facts.length} facts`);
    stats.recordFacts(userId, userName, stored);
  } catch (err) {
    console.error(`[learn]  user=${userId} failed:`, (err as Error).message);
  }
}

/** Store one explicit fact the user asked us to remember. */
export async function rememberExplicit(userId: number, userName: string, fact: string) {
  const result = await withRetry("remember", () => memwal.rememberAndWait(fact, namespaceFor(userId), { timeoutMs: 30_000 }));
  stats.recordFacts(userId, userName, [fact]);
  console.log(`[remember] user=${userId} blob=${result.blob_id} "${fact}"`);
  return result;
}
