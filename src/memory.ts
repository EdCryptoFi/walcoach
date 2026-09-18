/**
 * Thin wrapper around the Walrus Memory SDK.
 *
 * Every Telegram user gets their own namespace (`<prefix>-<telegramUserId>`),
 * so recall for one user can never surface another user's memories — the
 * relayer enforces owner+namespace isolation at the query level.
 */
import { MemWal } from "@mysten-incubation/memwal";
import { config } from "./config.js";
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

/** Semantic recall of what we know about this user that is relevant to `query`. */
export async function recallForUser(userId: number, query: string, limit = 8): Promise<Memory[]> {
  const started = Date.now();
  const result = await memwal.recall({
    query,
    namespace: namespaceFor(userId),
    limit,
    // Anything above ~0.7 cosine distance is usually unrelated filler.
    maxDistance: 0.7,
  });
  const memories = result.results.map((r) => ({ text: r.text, distance: r.distance, blobId: r.blob_id }));
  console.log(
    `[recall] user=${userId} q="${query.slice(0, 60)}" hits=${memories.length}/${result.total} ${Date.now() - started}ms`,
  );
  for (const m of memories) console.log(`         ${m.distance.toFixed(3)}  ${m.text}`);
  return memories;
}

/** Broad recall used by /memories — no relevance cutoff, just "everything close to being about the user". */
export async function listMemories(userId: number, limit = 25): Promise<Memory[]> {
  const result = await memwal.recall({
    query: "facts, preferences, goals, habits, struggles and personal details about the user",
    namespace: namespaceFor(userId),
    limit,
  });
  return result.results.map((r) => ({ text: r.text, distance: r.distance, blobId: r.blob_id }));
}

/**
 * Let the relayer extract durable facts from the latest exchange and store
 * each one as its own encrypted blob on Walrus. Runs after the reply is sent
 * so the user never waits on storage.
 */
export async function learnFromExchange(userId: number, userName: string, userMessage: string, assistantReply: string) {
  const text = [
    `Conversation with ${userName}. Extract only durable facts about the user (goals, habits, preferences, constraints, progress, life details). Ignore the coach's own words.`,
    `User: ${userMessage}`,
    `Coach: ${assistantReply}`,
  ].join("\n");

  try {
    const result = await memwal.analyzeAndWait(text, namespaceFor(userId), { timeoutMs: 60_000 });
    if (result.facts.length === 0) {
      console.log(`[learn]  user=${userId} no new facts`);
      return;
    }
    console.log(`[learn]  user=${userId} stored ${result.succeeded}/${result.facts.length} facts`);
    for (const fact of result.facts) console.log(`         + ${fact.text}`);
    stats.recordFacts(userId, userName, result.facts.map((f) => f.text));
  } catch (err) {
    console.error(`[learn]  user=${userId} failed:`, err);
  }
}

/** Store one explicit fact the user asked us to remember. */
export async function rememberExplicit(userId: number, userName: string, fact: string) {
  const result = await memwal.rememberAndWait(fact, namespaceFor(userId), { timeoutMs: 30_000 });
  stats.recordFacts(userId, userName, [fact]);
  console.log(`[remember] user=${userId} blob=${result.blob_id} "${fact}"`);
  return result;
}
