/**
 * The memory-aware chat pipeline, independent of Telegram so the bot and the
 * evaluation harness run exactly the same code.
 */
import { generateReply, type Turn, type Voice } from "./llm.js";
import type { Source } from "./search.js";
import { log } from "./log.js";
import { extractNewFacts, learnFromExchange, recallForUser, type Memory } from "./memory.js";

const history = new Map<number, Turn[]>();
const MAX_TURNS = 12;

function pushTurn(userId: number, turn: Turn) {
  const turns = history.get(userId) ?? [];
  turns.push(turn);
  history.set(userId, turns.slice(-MAX_TURNS));
}

export function resetHistory(userId: number) {
  history.delete(userId);
}

export interface ChatResult {
  reply: string;
  memories: Memory[];
  /** false when Walrus Memory could not be reached and the reply was made without recall. */
  memoryAvailable: boolean;
  /** Facts extracted from this message; being written to Walrus in the background. */
  facts: string[];
  /** Web sources consulted for this reply (empty when no search happened). */
  sources: Source[];
  /** Resolves when background learning finishes (the bot doesn't await it). */
  learning: Promise<void>;
}

export interface ChatOptions {
  useMemory?: boolean;
  /** Short-term history supplied by the caller (stateless deployments); defaults to the in-RAM history. */
  history?: Turn[];
  /** Life area the user picked on the landing page (label), if any. */
  context?: string;
  /** "character" = the mentor's own style; "neutral" = plain coach voice (default). */
  voice?: Voice;
}

export async function chat(userId: number, userName: string, text: string, options: ChatOptions | boolean = {}): Promise<ChatResult> {
  const { useMemory = true, history: given, context: area, voice = "neutral" } = typeof options === "boolean" ? { useMemory: options } : options;

  // 1. Recall what we know that is relevant to this message.
  const recall = useMemory ? await recallForUser(userId, text) : { memories: [], available: true };
  const memories = recall.memories;

  // 2. Generate with memories in the system prompt + short-term history.
  let turns: Turn[];
  if (given) {
    turns = [...given.slice(-MAX_TURNS), { role: "user", content: text }];
  } else {
    pushTurn(userId, { role: "user", content: text });
    turns = history.get(userId) ?? [];
  }
  // Extraction runs alongside generation (both are one model call) so the caller
  // gets the facts back with the reply and can retry the write if it fails later.
  const context = turns.slice(-3, -1).map((t) => `${t.role === "user" ? "User" : "Coach"}: ${t.content}`).join("\n");
  const [generated, facts] = await Promise.all([
    generateReply(userName, memories, turns, area, voice),
    useMemory ? extractNewFacts(userName, text, context, memories).catch((err) => { log.error("extract.failed", err, { user: userId }); return [] as string[]; }) : Promise.resolve([] as string[]),
  ]);
  const reply = generated.text;
  if (!given) pushTurn(userId, { role: "assistant", content: reply });

  // 3. Store the facts (caller decides whether to await).
  const learning = useMemory && facts.length > 0 ? learnFromExchange(userId, userName, text, reply, memories, facts) : Promise.resolve();

  return { reply, memories, memoryAvailable: recall.available, facts, sources: generated.sources, learning };
}
