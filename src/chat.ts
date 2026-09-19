/**
 * The memory-aware chat pipeline, independent of Telegram so the bot and the
 * evaluation harness run exactly the same code.
 */
import { generateReply, type Turn } from "./llm.js";
import { learnFromExchange, recallForUser, type Memory } from "./memory.js";

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
  /** Resolves when background learning finishes (the bot doesn't await it). */
  learning: Promise<void>;
}

export interface ChatOptions {
  useMemory?: boolean;
  /** Short-term history supplied by the caller (stateless deployments); defaults to the in-RAM history. */
  history?: Turn[];
}

export async function chat(userId: number, userName: string, text: string, options: ChatOptions | boolean = {}): Promise<ChatResult> {
  const { useMemory = true, history: given } = typeof options === "boolean" ? { useMemory: options } : options;

  // 1. Recall what we know that is relevant to this message.
  const memories = useMemory ? await recallForUser(userId, text) : [];

  // 2. Generate with memories in the system prompt + short-term history.
  let turns: Turn[];
  if (given) {
    turns = [...given.slice(-MAX_TURNS), { role: "user", content: text }];
  } else {
    pushTurn(userId, { role: "user", content: text });
    turns = history.get(userId) ?? [];
  }
  const reply = await generateReply(userName, memories, turns);
  if (!given) pushTurn(userId, { role: "assistant", content: reply });

  // 3. Learn from the exchange (caller decides whether to await).
  const learning = useMemory ? learnFromExchange(userId, userName, text, reply, memories) : Promise.resolve();

  return { reply, memories, learning };
}
