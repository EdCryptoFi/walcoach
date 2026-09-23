/**
 * Thin wrapper around the Walrus Memory SDK.
 *
 * Every Telegram user gets their own namespace (`<prefix>-<telegramUserId>`),
 * so recall for one user can never surface another user's memories, the
 * relayer enforces owner+namespace isolation at the query level.
 *
 * Request budget matters: the relayer rate-limits per delegate key
 * (60 weighted requests/min) and per account (1000/hour), and one bot serves
 * every user with a single key. So this module is deliberately frugal:
 * ~1 recall per message, one bulk write per exchange, no extra dedupe calls.
 */
import { MemWal } from "@mysten-incubation/memwal";
import { delegateSecretFor, isAccountId } from "./accounts.js";
import { config } from "./config.js";
import { extractFacts } from "./extract.js";
import { stats } from "./stats.js";
import { log } from "./log.js";

/** The project account. Used for legacy users and for the push registry. */
export const memwal = MemWal.create({
  key: config.memwalKey,
  accountId: config.memwalAccountId,
  serverUrl: config.memwalServerUrl,
  namespace: config.namespacePrefix,
});

/**
 * Who we are writing for.
 *
 * `own`: the user has their own MemWalAccount (level 2). The blobs belong to them,
 * WalCoach is only a delegate, and one namespace inside that account is enough.
 * `shared`: legacy users created before per-user accounts. They live in the project
 * account, isolated by namespace.
 */
export interface Identity { mode: "own" | "shared"; accountId: string; namespace: string; id: number }

const clients = new Map<string, MemWal>();
function clientFor(identity: Identity): MemWal {
  if (identity.mode === "shared") return memwal;
  let c = clients.get(identity.accountId);
  if (!c) {
    // The key, not the account id, is what the relayer scopes by, so each account
    // gets its own derived delegate key (see accounts.ts `delegateFor`).
    c = MemWal.create({ key: delegateSecretFor(identity.accountId), accountId: identity.accountId, serverUrl: config.memwalServerUrl, namespace: identity.namespace });
    clients.set(identity.accountId, c);
  }
  return c;
}

/** Turns whatever the browser sent into an identity: an account id, or a legacy memory key. */
export function identityFor(userKey: string, numericId: number): Identity {
  // Every user gets their own namespace, including account owners. The relayer
  // resolves the account from the *delegate key*, not from the accountId we
  // send, so one server key cannot address many accounts: without a per-user
  // namespace, every account owner would read the same pool. See docs/RELAYER-ACCOUNT-SCOPING.md.
  const namespace = `${config.namespacePrefix}-${numericId}`;
  return isAccountId(userKey)
    ? { mode: "own", accountId: userKey, namespace, id: numericId }
    : { mode: "shared", accountId: config.memwalAccountId, namespace, id: numericId };
}

export function namespaceFor(userId: number | string): string {
  return `${config.namespacePrefix}-${userId}`;
}

export interface Memory {
  text: string;
  distance: number;
  blobId: string;
}

export interface Recall {
  memories: Memory[];
  /** false when the relayer could not be reached, the caller is answering blind. */
  available: boolean;
}

// Cosine-distance cutoff observed with the relayer's embedding model.
// Cross-language hits (PT question, EN fact) land around 0.55–0.75, so the
// cutoff is deliberately loose; the LLM is told to ignore what isn't useful.
const RELEVANT = 0.8;
const PROFILE_QUERY = "the user's main goal, deadline, weekly schedule, constraints and current struggle";
const PROFILE_TTL_MS = 10 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Memory texts are personal. Only print them when explicitly asked (local dev / eval).
const VERBOSE = process.env.LOG_MEMORIES === "1";
const detail = (line: string) => { if (VERBOSE) console.log(line); };

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
      log.warn("relayer.retry", { op: label, attempt, delayMs: delay, error: msg.slice(0, 160) });
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
const profileCache = new Map<string, { at: number; memories: Memory[] }>();
const cacheKey = (who: Identity) => `${who.accountId}:${who.namespace}`;

async function profileFor(who: Identity): Promise<Memory[]> {
  const cached = profileCache.get(cacheKey(who));
  if (cached && Date.now() - cached.at < PROFILE_TTL_MS) return cached.memories;
  const result = await withRetry("recall", () => clientFor(who).recall({ query: PROFILE_QUERY, namespace: who.namespace, limit: 5 }), { tries: 2, maxWaitMs: 3000 });
  const memories = result.results.map(toMemory);
  profileCache.set(cacheKey(who), { at: Date.now(), memories });
  return memories;
}

/**
 * What we know about this user that matters for `query`: one recall driven by
 * the message, merged with the (cached) core profile. If the relayer is rate
 * limited we answer without memory rather than make the user wait.
 */
export async function recallForUser(who: Identity, query: string, limit = 8, attempt = 1): Promise<Recall> {
  const started = Date.now();
  let byMessage: Memory[] = [];
  let profile: Memory[] = [];
  try {
    [byMessage, profile] = await Promise.all([
      withRetry("recall", () => clientFor(who).recall({ query, namespace: who.namespace, limit, maxDistance: RELEVANT }), { tries: 2, maxWaitMs: 3000 }).then((r) => r.results.map(toMemory)),
      profileFor(who),
    ]);
  } catch (err) {
    log.error("recall.unavailable", err, { user: who.id });
    return { memories: [], available: false };
  }

  const seen = new Set<string>();
  const merged = [...byMessage, ...profile].filter((m) => !seen.has(m.blobId) && seen.add(m.blobId));
  merged.sort((a, b) => a.distance - b.distance);
  const memories = merged.slice(0, limit);

  if (memories.length === 0 && attempt < 2 && knownToHaveMemories(who.id)) {
    // Observed: the relayer occasionally returns an empty result set (no error)
    // for a namespace that has memories. Retry once before answering blind.
    log.warn("recall.empty_for_known_user", { user: who.id, attempt });
    profileCache.delete(cacheKey(who));
    await sleep(1500);
    return recallForUser(who, query, limit, attempt + 1);
  }

  console.log(`[recall] user=${who.id} mode=${who.mode} hits=${memories.length} (msg=${byMessage.length}, profile=${profile.length}) ${Date.now() - started}ms`);
  detail(`         q="${query.slice(0, 60)}"`);
  for (const m of memories) detail(`         ${m.distance.toFixed(3)}  ${m.text}`);
  return { memories, available: true };
}

/** Broad recall used by /memories, no relevance cutoff. */
export async function listMemories(who: Identity, limit = 25): Promise<Memory[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await withRetry("recall", () =>
      clientFor(who).recall({ query: "facts, preferences, goals, habits, struggles and personal details about the user", namespace: who.namespace, limit }),
    );
    if (result.results.length > 0 || !knownToHaveMemories(who.id)) return result.results.map(toMemory);
    log.warn("memories.empty_for_known_user", { user: who.id, attempt });
    await sleep(1500);
  }
  return [];
}

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Facts already extracted for this turn (see chat.ts), to be stored without re-extracting. */
export type FactList = string[];

/** Extract facts only (no storage). `known` keeps the extractor from re-stating what we have. */
export async function extractNewFacts(userName: string, userMessage: string, context: string, known: Memory[] = [], coachReply = ""): Promise<FactList> {
  const knownTexts = known.map((m) => m.text);
  const knownSet = new Set(knownTexts.map(normalize));
  return (await extractFacts(userName, userMessage, context, knownTexts, coachReply)).filter((f) => !knownSet.has(normalize(f)));
}

/**
 * Store facts from the latest exchange on Walrus in one bulk write. Runs after
 * the reply is sent so the user never waits.
 *
 * `known` is what was recalled for this turn: it is passed to the extractor
 * so it doesn't re-state facts we already have (no extra relayer calls).
 * When `facts` is given (already extracted), extraction is skipped.
 *
 * MEMORY_EXTRACTOR=llm (default): our model extracts, then `rememberBulkAndWait`.
 * MEMORY_EXTRACTOR=relayer: the relayer's `analyzeAndWait` does extraction + storage.
 */
export async function learnFromExchange(who: Identity, userName: string, userMessage: string, assistantReply: string, known: Memory[] = [], facts?: FactList) {
  const namespace = who.namespace;
  const client = clientFor(who);
  try {
    if (config.extractor === "relayer") {
      const text = `User (${userName}): ${userMessage}\nCoach: ${assistantReply}`;
      const result = await withRetry("analyze", () => client.analyzeAndWait(text, namespace, { timeoutMs: 60_000, pollIntervalMs: 3000 }));
      console.log(`[learn]  user=${who.id} relayer stored ${result.succeeded}/${result.facts.length} facts`);
      for (const fact of result.facts) detail(`         + ${fact.text}`);
      stats.recordFacts(who.id, userName, result.facts.map((f) => f.text));
      profileCache.delete(cacheKey(who));
      return;
    }

    const toStore = facts ?? (await extractNewFacts(userName, userMessage, "", known, assistantReply));
    if (toStore.length === 0) {
      console.log(`[learn]  user=${who.id} no new facts`);
      return;
    }

    const result = await withRetry("remember", () =>
      client.rememberBulkAndWait(toStore.map((text) => ({ text, namespace })), { timeoutMs: 90_000, pollIntervalMs: 3000 }),
    );
    const stored = toStore.filter((_, i) => result.results[i]?.status === "done");
    result.results.forEach((r, i) => detail(`         ${r.status === "done" ? "+" : "!"} ${toStore[i]}  [${r.blob_id || r.error}]`));
    console.log(`[learn]  user=${who.id} mode=${who.mode} stored ${stored.length}/${toStore.length} facts`);
    stats.recordFacts(who.id, userName, stored);
    if (stored.length > 0) profileCache.delete(cacheKey(who));
  } catch (err) {
    log.error("learn.failed", err, { user: who.id });
  }
}

/**
 * Store one explicit fact (from /remember or the browser outbox retrying a
 * failed background write). Dedupes first, since a retried fact may have
 * landed after all.
 */
export async function rememberExplicit(who: Identity, userName: string, fact: string) {
  const namespace = who.namespace;
  const client = clientFor(who);
  const dup = await withRetry("recall", () => client.recall({ query: fact, namespace, limit: 1, maxDistance: 0.15 }), { tries: 2, maxWaitMs: 3000 });
  if (dup.results[0]) {
    console.log(`[remember] user=${who.id} already stored (d=${dup.results[0].distance.toFixed(3)})`);
    return { blob_id: dup.results[0].blob_id, duplicate: true };
  }
  const result = await withRetry("remember", () => client.rememberAndWait(fact, namespace, { timeoutMs: 60_000, pollIntervalMs: 3000 }));
  stats.recordFacts(who.id, userName, [fact]);
  profileCache.delete(cacheKey(who));
  console.log(`[remember] user=${who.id} blob=${result.blob_id}`);
  detail(`         + ${fact}`);
  return result;
}

/**
 * Copies every fact a legacy user has in the shared project account into the
 * account they now own. The blobs are rewritten, not moved: Walrus is
 * append-only and the old ones stay where they are, unreadable without the old
 * key. Writes are submitted without waiting, because indexing takes 5 to 30
 * seconds per fact and the browser polls for them anyway.
 */
export async function migrateMemories(from: Identity, to: Identity, limit = 60) {
  const facts = await listMemories(from, limit);
  const texts = [...new Set(facts.map((m) => m.text.trim()).filter(Boolean))];
  if (texts.length === 0) {
    console.log(`[migrate] user=${from.id} nothing to move`);
    return { found: 0, accepted: 0 };
  }
  const accepted = await withRetry("remember", () =>
    clientFor(to).rememberBulk(texts.map((text) => ({ text, namespace: to.namespace }))),
  );
  profileCache.delete(cacheKey(to));
  console.log(`[migrate] user=${from.id} -> ${to.accountId} submitted ${accepted.total}/${texts.length} facts`);
  return { found: texts.length, accepted: accepted.total, facts: texts };
}
